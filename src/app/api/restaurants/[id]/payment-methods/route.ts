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
                restaurantId: restaurantId
            },
            orderBy: { createdAt: 'desc' }
        })

        // Deduplicate: Keep only the most relevant method per type
        // Priority: Active > Inactive. Tie-breaker: Latest Created.
        const uniqueMethodsMap = new Map()

        methods.forEach(method => {
            const existing = uniqueMethodsMap.get(method.type)
            if (!existing) {
                uniqueMethodsMap.set(method.type, method)
            } else {
                // If existing is Inactive and new is Active, replace
                if (!existing.isActive && method.isActive) {
                    uniqueMethodsMap.set(method.type, method)
                }
                // If both same status, keep new (latest) because of orderBy desc ??
                // Actually orderBy desc means First is Latest.
                // So if we see it first, it's the latest.
                // If existing (latest) is Inactive, and we find another Inactive, we ignore.
                // If existing is Inactive, and we find Active (older), do we want the Active one?
                // Probably yes, we want the Active one regardless of age if the "latest" was accidentally disabled duplicate?
                // But usually User wants the Active one.
                // Let's iterate and pick the BEST one.
            }
        })

        // Better Logic: Filter inside the array
        const processed = methods.reduce((acc: any[], curr) => {
            const existingIndex = acc.findIndex(item => item.type === curr.type)
            if (existingIndex === -1) {
                acc.push(curr)
            } else {
                // If we have an existing one, should we replace it?
                // We want the ACTIVE one.
                if (!acc[existingIndex].isActive && curr.isActive) {
                    acc[existingIndex] = curr
                }
                // If both active, keep the one already there (Latest, due to sort)
            }
            return acc
        }, [])

        return NextResponse.json({ success: true, data: processed })
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

        // Check for duplicates
        const existing = await prisma.paymentMethod.findFirst({
            where: {
                restaurantId: restaurantId,
                type: type
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
                qrCode: qrCode || null, // Allow explicit null
                isActive: isActive ?? true
            }
        })

        return NextResponse.json({ success: true, data: newMethod })
    } catch (error: any) {
        console.error('Add Payment Method Error:', error)
        return NextResponse.json({ success: false, error: error.message || 'Failed to add' }, { status: 500 })
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
        const { paymentId, type, merchantId, qrCode, isActive } = body

        if (!paymentId) return NextResponse.json({ success: false, error: 'Payment ID missing' }, { status: 400 })

        const updateData: any = {}
        if (type !== undefined) updateData.type = type
        if (merchantId !== undefined) updateData.merchantId = merchantId
        if (qrCode !== undefined) updateData.qrCode = qrCode
        if (isActive !== undefined) updateData.isActive = isActive

        const updated = await prisma.paymentMethod.update({
            where: { id: paymentId },
            data: updateData
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error: any) {
        console.error("Payment Update Error:", error)
        return NextResponse.json({ success: false, error: error.message || 'Failed update' }, { status: 500 })
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
        await prisma.paymentMethod.delete({
            where: { id: paymentId }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
