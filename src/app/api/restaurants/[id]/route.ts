import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const idOrSlug = params.id

    try {
        // Try to find by ID first, then Slug
        const restaurant = await prisma.restaurant.findFirst({
            where: {
                OR: [
                    { id: idOrSlug },
                    { slug: idOrSlug }
                ]
            },
            include: {
                menuItems: {
                    where: { isAvailable: true },
                    include: { category: true } // Include category to get name
                },
                categories: true,
                paymentMethods: {
                    where: { isActive: true }
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

        // Transform data if necessary (e.g. flattening categoryName)
        const transformedData = {
            ...restaurant,
            menuItems: restaurant.menuItems.map(item => ({
                ...item,
                categoryName: item.category?.name || 'Other'
            }))
        }

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
    const idOrSlug = params.id.trim()
    console.log(`[DELETE] Request for idOrSlug: ${idOrSlug}`) // DEBUG LOG

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
            console.log(`[DELETE] Restaurant not found for: ${idOrSlug}`)
            return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
        }

        console.log(`[DELETE] Found restaurant ${restaurant.name} (${restaurant.id}), starting clean delete...`)

        // Perform manual cascade delete in transaction to avoid FK issues
        await prisma.$transaction(async (tx) => {
            // 1. Get all Order IDs
            const orders = await tx.order.findMany({
                where: { restaurantId: restaurant.id },
                select: { id: true }
            })
            const orderIds = orders.map(o => o.id)

            // 2. Delete Order-related data
            if (orderIds.length > 0) {
                await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
                await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } })
                await tx.order.deleteMany({ where: { id: { in: orderIds } } })
            }

            // 3. Delete Menu-related data
            await tx.menuItem.deleteMany({ where: { restaurantId: restaurant.id } })
            await tx.category.deleteMany({ where: { restaurantId: restaurant.id } })

            // 4. Delete Config data
            await tx.paymentMethod.deleteMany({ where: { restaurantId: restaurant.id } })

            // 5. Delete Restaurant (and branches if any? leaving that for now)
            await tx.restaurant.delete({ where: { id: restaurant.id } })
        })

        console.log(`[DELETE] Successfully deleted restaurant ${restaurant.id}`)
        return NextResponse.json({ success: true, message: 'Restaurant deleted successfully' })
    } catch (error) {
        console.error('Error deleting restaurant:', error)
        return NextResponse.json({ success: false, error: 'Failed to delete restaurant. Check server logs.' }, { status: 500 })
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
        const { id, ...updates } = body // ID in body might be ignored

        // 1. Resolve to actual ID
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
            console.log(`[PUT] Restaurant not found for: ${idOrSlug}`) // DEBUG LOG
            return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
        }

        console.log(`[PUT] Updating restaurant ${restaurant.id}`) // DEBUG LOG

        const updated = await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: updates
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error("Update failed:", error)
        return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
    }
}
