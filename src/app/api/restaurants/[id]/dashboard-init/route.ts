
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCache, setCache } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const restaurantId = params.id
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!restaurantId) {
        return NextResponse.json({ success: false, error: 'Restaurant ID required' }, { status: 400 })
    }

    try {
        const ts = new Date().getTime()

        // Parallel Fetching from DB directly to avoid multiple HTTP roundtrips
        // We can reuse logic or just Promise.all prisma calls

        // 1. Restaurant Details (and Menu/Categories/PaymentMethods via include?)
        // Actually, getting everything in one giant query might be heavy but faster than 5 HTTP requests.
        // Let's use Promise.all on Prisma calls.

        const [restaurant, announcements, branches] = await Promise.all([
            prisma.restaurant.findUnique({
                where: { id: restaurantId },
                include: {
                    categories: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'desc' }
                    },
                    menuItems: {
                        where: { deletedAt: null, isAvailable: true, category: { deletedAt: null } },
                        include: { category: true }
                    },
                    paymentMethods: {
                        // where: { isActive: true }, // We established we want ALL but deduplicated
                        orderBy: { createdAt: 'desc' }
                    }
                }
            }),
            prisma.announcement.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
                take: 1
            }),
            // Branches (if adminId provided)
            adminId ? prisma.restaurant.findMany({
                where: {
                    OR: [{ id: restaurantId }, { parentId: restaurantId }], // Siblings or Children?
                    // Actually requirement says "tambah cabang dari super admin" -> parent creates branches.
                    // If we are parent, we want children.
                    // If we are child, we might want siblings?
                    // Let's stick to previous logic: filter by adminId in frontend? 
                    // Previous logic: fetch `/api/restaurants?adminId=...`
                    deletedAt: null
                }
            }) : Promise.resolve([])
        ])

        if (!restaurant) {
            return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
        }

        // Process Payment Methods Deduplication
        const processedMethods = restaurant.paymentMethods.reduce((acc: any[], curr) => {
            const existingIndex = acc.findIndex(item => item.type === curr.type)
            if (existingIndex === -1) {
                acc.push(curr)
            } else {
                if (!acc[existingIndex].isActive && curr.isActive) {
                    acc[existingIndex] = curr
                }
            }
            return acc
        }, [])

        // Process Branches (Filter for this restaurant's network)
        // If restaurant is parent, find children.
        // If restaurant is child, find siblings?
        // Let's just return what we found relative to this restaurant ID.
        // The optimized logic:
        // If current restaurant has children, return them.
        let myBranches: any[] = []
        if (adminId) {
            // Re-implement the logic from loadBranches:
            // r.parentId === currentRestaurant.id
            myBranches = branches.filter((b: any) => b.parentId === restaurant.id)
        }

        // Transform Data
        const data = {
            restaurant: {
                ...restaurant,
                paymentMethods: processedMethods // Override with processed
            },
            menuItems: restaurant.menuItems.map(item => ({ ...item, categoryName: item.category?.name || 'Other' })),
            categories: restaurant.categories,
            paymentMethods: processedMethods,
            activeAnnouncements: announcements,
            myBranches: myBranches
        }

        return NextResponse.json({ success: true, data })

    } catch (error) {
        console.error("Dashboard Init Error", error)
        return NextResponse.json({ success: false, error: 'Failed to load dashboard' }, { status: 500 })
    }
}
