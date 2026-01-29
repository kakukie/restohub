import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const idOrSlug = params.id // In Next.js [id] captures the segment

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
                    where: { isAvailable: true }
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

        return NextResponse.json({
            success: true,
            data: restaurant
        })
    } catch (error) {
        console.error('Error fetching restaurant:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
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
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { id, ...updates } = body // ID in body might be ignored or checked against params.id

        // Ensure we update the correct ID
        const targetId = params.id

        const updated = await prisma.restaurant.update({
            where: { id: targetId },
            data: updates
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
    }
}
