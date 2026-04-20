import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { normalizeMediaUrl } from '@/lib/media-url'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

import { getCache, setCache, invalidateCache } from '@/lib/redis'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const idOrSlug = params.id
    const cacheKey = `dashboard:${idOrSlug}`

    try {
        // 1. Check Redis Cache
        const cachedData = await getCache(cacheKey)
        if (cachedData) {
            return NextResponse.json({ success: true, data: cachedData })
        }

        // 2. Fetch from DB
        const restaurant = await prisma.restaurant.findFirst({
            where: {
                deletedAt: null,
                OR: [
                    { id: idOrSlug },
                    { slug: { equals: idOrSlug, mode: 'insensitive' } }
                ]
            },
            include: {
                menuItems: {
                    where: {
                        isAvailable: true,
                        deletedAt: null,
                        category: {
                            deletedAt: null // Fix: Exclude items from soft-deleted categories
                        }
                    },
                    include: { category: true }
                },
                categories: {
                    where: {
                        deletedAt: null
                    },
                    orderBy: [
                        { displayOrder: 'asc' },
                        { createdAt: 'desc' }
                    ]
                },
                paymentMethods: {
                    where: {
                        deletedAt: null // Fix: Exclude soft-deleted methods
                    }
                },
                _count: {
                    select: { orders: true, menuItems: true }
                }
            }
        })

        if (!restaurant) {
            return NextResponse.json(
                { success: false, error: 'Restaurant not found' },
                { status: 404 }
            )
        }

        // Transform data
        const transformedData = {
            ...restaurant,
            logo: normalizeMediaUrl(restaurant.logo, request),
            banner: normalizeMediaUrl(restaurant.banner, request),
            // Ensure scalars are present (though ...restaurant should have them)
            maxCategories: restaurant.maxCategories,
            slugChangeCount: restaurant.slugChangeCount,
            maxSlugChanges: restaurant.maxSlugChanges,
            maxBranches: restaurant.maxBranches,
            menuItems: restaurant.menuItems.map(item => ({
                ...item,
                image: normalizeMediaUrl(item.image, request),
                categoryName: item.category?.name || 'Other'
            }))
        }

        // 3. Set Cache (TTL 60s)
        await setCache(cacheKey, transformedData, 60)

        return NextResponse.json({
            success: true,
            data: transformedData
        })
    } catch (error) {
        console.error('Error fetching restaurant:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const idOrSlug = params.id

    try {
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const restaurant = await prisma.restaurant.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ]
            },
            select: { id: true }
        })

        if (!restaurant) {
            return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
        }

        // Authorize: Block Demo + Ensure Ownership
        const auth = authorizeAction(user, restaurant.id, 'DELETE')
        if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

        // Hard Delete (Cascade takes care of children as defined in Schema)
        await prisma.restaurant.delete({
            where: { id: restaurant.id }
        })

        // Also invalidate the cache so it doesn't show up again
        await invalidateCache(`dashboard:${restaurant.id}`)
        await invalidateCache(`dashboard:${idOrSlug}`)

        return NextResponse.json({ success: true, message: 'Restaurant deleted successfully' })
    } catch (error) {
        console.error('Error deleting restaurant:', error)
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
    }
}

// PUT /api/restaurants/[id] - Update Restaurant
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const idOrSlug = params.id

    try {
        const body = await request.json()
        const { id, logoUrl, bannerUrl, ...otherUpdates } = body

        const updates: any = { ...otherUpdates }

        if (logoUrl) updates.logo = logoUrl
        if (bannerUrl) updates.banner = bannerUrl
        
        if (updates.activeUntil === "") {
            updates.activeUntil = null
        } else if (updates.activeUntil) {
            const dt = new Date(updates.activeUntil)
            if (isNaN(dt.getTime())) {
                return NextResponse.json({ success: false, error: 'Invalid activeUntil date' }, { status: 400 })
            }
            const dtUtc = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
            updates.activeUntil = dtUtc
        }

        const allowedFields = [
            'name', 'description', 'address', 'phone', 'email',
            'logo', 'banner', 'slug', 'theme', 'status', 'isActive',
            'detailAddress', 'googleMapsUrl', 'latitude', 'longitude',
            'allowMaps', 'enableAnalytics', 'printerSettings',
            'maxCategories', 'maxMenuItems', 'maxBranches', 'maxStaff', 'maxAdmins', 'package', 'allowBranches', 'maxSlugChanges',
            'activeUntil'
        ]

        const cleanUpdates: any = {}
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                cleanUpdates[key] = updates[key]
            }
        })

        // 1. Resolve to actual ID and check ownership
        const restaurant = await prisma.restaurant.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ]
            },
            select: { id: true, slug: true, slugChangeCount: true, maxSlugChanges: true }
        })

        if (!restaurant) {
            return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
        }

        // Otorisasi
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const auth = authorizeAction(user, restaurant.id, 'PUT')
        if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

        // Check Slug Limit
        if (cleanUpdates.slug && cleanUpdates.slug !== restaurant.slug) {
            const currentCount = restaurant.slugChangeCount || 0
            const maxLimit = restaurant.maxSlugChanges ?? 3

            if (currentCount >= maxLimit) {
                return NextResponse.json({
                    success: false,
                    error: `Limit perubahan slug tercapai (${currentCount}/${maxLimit}). Hubungi bantuan.`
                }, { status: 403 })
            }
            cleanUpdates.slugChangeCount = currentCount + 1
        }

        cleanUpdates.deletedAt = null;

        const updated = await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: cleanUpdates
        })

        // Redis Invalidation
        await invalidateCache(`dashboard:${restaurant.id}`)
        await invalidateCache(`dashboard:${restaurant.slug}`)
        if (updated.slug !== restaurant.slug) {
            await invalidateCache(`dashboard:${updated.slug}`)
        }

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error("Update failed:", error)
        return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
    }
}
