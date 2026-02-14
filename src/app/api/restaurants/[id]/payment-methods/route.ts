import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getRestaurantId(idOrSlug: string) {
    if (!idOrSlug) return null

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
        console.error(`getRestaurantId failed for input: ${idOrSlug}`)
    }
    return restaurant?.id
}

// GET (Updated)
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const restaurantId = await getRestaurantId(params.id)
        if (!restaurantId) return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })

        const methods = await prisma.paymentMethod.findMany({
            where: {
                restaurantId: restaurantId,
                deletedAt: null // Only show non-deleted methods
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ success: true, data: methods })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
    }
}

// POST: Create Payment Method
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const restaurantId = await getRestaurantId(params.id)
        if (!restaurantId) return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })

        const body = await request.json()
        const { type, merchantId, qrCode, isActive } = body

        if (!type) {
            return NextResponse.json({ success: false, error: 'Payment type is required' }, { status: 400 })
        }

        // Check for duplicates (ONLY among active/non-deleted ones? Or globally?)
        // Better: Check among non-deleted ones. If deleted one exists, maybe revive it? 
        // For simplicity: Check non-deleted.
        const existing = await prisma.paymentMethod.findFirst({
            where: {
                restaurantId: restaurantId,
                type: type,
                deletedAt: null
            }
        })

        if (existing) {
            return NextResponse.json({ success: false, error: `Payment method ${type} already exists` }, { status: 400 })
        }

        // Check if there is a deleted one we can revive? 
        // Optional optimization, but creating new is safer for history separation.

        const newMethod = await prisma.paymentMethod.create({
            data: {
                restaurantId: restaurantId,
                type,
                merchantId: merchantId || null,
                qrCode: qrCode || null,
                isActive: isActive ?? true
            }
        })

        return NextResponse.json({ success: true, data: newMethod })
    } catch (error: any) {
        console.error('Add Payment Method Error:', error)
        return NextResponse.json({ success: false, error: error.message || 'Failed to add' }, { status: 500 })
    }
}

// ... PUT remains similar but ensure we update correct one (id is unique so fine) ...

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) return NextResponse.json({ success: false }, { status: 400 })

    try {
        // Soft Delete
        await prisma.paymentMethod.update({
            where: { id: paymentId },
            data: { deletedAt: new Date() }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
