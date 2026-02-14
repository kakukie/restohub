import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
                    { slug: idOrSlug }
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
                    }
                },
                paymentMethods: {
                    where: {
                        isActive: true
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
            // Ensure scalars are present (though ...restaurant should have them)
            maxCategories: restaurant.maxCategories,
            slugChangeCount: restaurant.slugChangeCount,
            maxSlugChanges: restaurant.maxSlugChanges,
            maxBranches: restaurant.maxBranches,
            menuItems: restaurant.menuItems.map(item => ({
                ...item,
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
        const restaurant = await prisma.restaurant.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ]
            },
            select: { id: true, name: true }
        })

        if (!restaurant) {
            return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
        }

        // Soft Delete (Recursive/Cascade Soft Delete?)
        // For now, let's just Soft Delete the restaurant.
        // Logic: If restaurant is deleted, access to sub-resources should be blocked by application logic checking restaurant.deletedAt.
        // Or we can cascade soft delete?
        // Let's stick to simple Restaurant Soft Delete for now, as it's reversible.

        await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: { deletedAt: new Date(), isActive: false }
        })

        return NextResponse.json({ success: true, message: 'Restaurant deleted successfully' })
    } catch (error) {
        console.error('Error deleting restaurant:', error)
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
    }
}

// PUT /api/restaurants/[id] - Update Restaurant
// Note: We also have PUT /api/restaurants (root) for updates without ID in URL if passed in body?
// But standard is PUT /api/restaurants/[id].
// The dashboard used PUT /api/restaurants with body { id, ... }.
// We can support both or prefer this one.
// Let's implement this one to be standard REST.
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const idOrSlug = params.id
    console.log(`[PUT] Request for idOrSlug: ${idOrSlug}`) // DEBUG LOG

    try {
        const body = await request.json()
        // Extract 'theme' and 'id' to exclude them from the update payload
        // Also map legacy frontend keys if present (logoUrl -> logo, bannerUrl -> banner)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, logoUrl, bannerUrl, ...otherUpdates } = body

        const updates: any = { ...otherUpdates }

        // Map keys if they exist
        if (logoUrl) updates.logo = logoUrl
        if (bannerUrl) updates.banner = bannerUrl

        // White-list allowed fields to prevent schema errors
        const allowedFields = [
            'name', 'description', 'address', 'phone', 'email',
            'logo', 'banner', 'slug', 'theme', 'status', 'isActive',
            'detailAddress', 'googleMapsUrl', 'latitude', 'longitude',
            // Configs (Allowed for Super Admin updates via this route)
            'allowMaps', 'enableAnalytics', 'printerSettings',
            'maxCategories', 'maxMenuItems', 'maxBranches', 'maxStaff', 'maxAdmins', 'package', 'allowBranches', 'maxSlugChanges'
        ]

        // Filter updates
        const cleanUpdates: any = {}
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                cleanUpdates[key] = updates[key]
            }
        })

        // 1. Resolve to actual ID
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
            console.log(`[PUT] Restaurant not found for: ${idOrSlug}`) // DEBUG LOG
            return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
        }

        // Check Slug Limit
        if (cleanUpdates.slug && cleanUpdates.slug !== restaurant.slug) {
            const currentCount = restaurant.slugChangeCount || 0
            const maxLimit = restaurant.maxSlugChanges ?? 3

            if (currentCount >= maxLimit) {
                return NextResponse.json({
                    success: false,
                    error: `Slug change limit reached (${currentCount}/${maxLimit}). Contact support.`
                }, { status: 403 })
            }

            // Increment count
            cleanUpdates.slugChangeCount = currentCount + 1
        }


        console.log(`[PUT] Updating restaurant ${restaurant.id} with keys: ${Object.keys(cleanUpdates).join(', ')}`) // DEBUG LOG

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

        // Revalidate cache to prevent stale data
        try {
            const { revalidatePath } = await import('next/cache')
            // Revalidate both potential new and old slug paths
            revalidatePath(`/menu/${updated.slug}`)
            if (restaurant.slug !== updated.slug) {
                revalidatePath(`/menu/${restaurant.slug}`)
            }
            // Revalidate dashboard
            revalidatePath('/dashboard')
        } catch (e) {
            console.error('Revalidate failed', e)
        }

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error("Update failed:", error)
        return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
    }
}
