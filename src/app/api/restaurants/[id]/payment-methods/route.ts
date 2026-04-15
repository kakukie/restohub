import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

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

// GET (Public - for QR menu to show payment methods)
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
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ success: true, data: methods })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
    }
}

// POST: Create Payment Method (Authenticated + Owner)
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const restaurantId = await getRestaurantId(params.id)
        if (!restaurantId) return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })

        // IDOR Protection
        const auth = authorizeAction(user, restaurantId, 'POST')
        if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

        const body = await request.json()
        const { type, merchantId, qrCode, isActive } = body

        if (!type) {
            return NextResponse.json({ success: false, error: 'Payment type is required' }, { status: 400 })
        }

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

// DELETE: Remove Payment Method (Authenticated + Owner)
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) return NextResponse.json({ success: false }, { status: 400 })

    try {
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        // Verify the payment method belongs to a restaurant the user owns
        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id: paymentId },
            select: { restaurantId: true }
        })

        if (!paymentMethod) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

        const auth = authorizeAction(user, paymentMethod.restaurantId, 'DELETE')
        if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

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
