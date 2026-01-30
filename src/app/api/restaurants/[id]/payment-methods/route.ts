import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

async function getRestaurantId(idOrSlug: string) {
    const restaurant = await prisma.restaurant.findFirst({
        where: {
            OR: [
                { id: idOrSlug },
                { slug: idOrSlug }
            ]
        },
        select: { id: true }
    })
    return restaurant?.id
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const restaurantId = await getRestaurantId(params.id)
        if (!restaurantId) return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })

        const methods = await prisma.paymentMethod.findMany({
            where: { restaurantId: restaurantId }
        })
        return NextResponse.json({ success: true, data: methods })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const restaurantId = await getRestaurantId(params.id)
        if (!restaurantId) return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })

        const body = await request.json()
        // Body should be PaymentMethod object
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

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { paymentId, ...updates } = body // Frontend must send paymentId in body

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
    { params }: { params: { id: string } }
) {
    // We need paymentId to delete. 
    // Usually DELETE body is not standard, but NextJS supports it or use searchParams?
    // Let's use searchParams ?paymentId=...
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) return NextResponse.json({ success: false }, { status: 400 })

    try {
        await prisma.paymentMethod.delete({
            where: { id: paymentId }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
