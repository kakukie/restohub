import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { invalidateCache } from '@/lib/redis'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { restaurantId, type, accountName, accountNumber, isActive, qrCode } = body

        if (!restaurantId || !type) {
            return NextResponse.json(
                { success: false, error: 'Restaurant ID and Type are required' },
                { status: 400 }
            )
        }

        // IDOR Protection
        const auth = authorizeAction(user, restaurantId, 'POST')
        if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

        // Check if exists
        const existing = await prisma.paymentMethod.findFirst({
            where: {
                restaurantId,
                type,
                deletedAt: null
            }
        })

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Payment method already exists' },
                { status: 400 }
            )
        }

        const newMethod = await prisma.paymentMethod.create({
            data: {
                restaurantId,
                type,
                accountName,
                accountNumber,
                qrCode,
                isActive: isActive ?? true
            }
        })

        await invalidateCache(`dashboard:${restaurantId}`)

        return NextResponse.json({
            success: true,
            data: newMethod
        })
    } catch (error) {
        console.error('Create payment method error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create payment method' },
            { status: 500 }
        )
    }
}
