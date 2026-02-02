import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
                deletedAt: null
            }
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

        const newMethod = await prisma.paymentMethod.create({
            data: {
                restaurantId: restaurantId,
                type,
                merchantId,
                qrCode,
                isActive: isActive ?? true
            }
        })

        return NextResponse.json({ success: true, data: newMethod })
    } catch (error) {
        console.error('Add Payment Method Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to add' }, { status: 500 })
    }
}

// PUT: Update Payment Method
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const body = await request.json()
        const { paymentId, ...updates } = body // Frontend must send paymentId in body

        if (!paymentId) return NextResponse.json({ success: false, error: 'Payment ID missing' }, { status: 400 })

        // Sanitize updates
        delete (updates as any).restaurant
        delete (updates as any).createdAt
        delete (updates as any).updatedAt

        const updated = await prisma.paymentMethod.update({
            where: { id: paymentId },
            data: updates
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed update' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    // We need paymentId to delete. 
    // Usually DELETE body is not standard, but NextJS supports it or use searchParams?
    // Let's use searchParams ?paymentId=...
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) return NextResponse.json({ success: false }, { status: 400 })

    try {
        await prisma.paymentMethod.update({
            where: { id: paymentId },
            data: { deletedAt: new Date(), isActive: false }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
