import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { invalidateCache } from '@/lib/redis'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { restaurantId, type, accountName, accountNumber, isActive } = body

        if (!restaurantId || !type) {
            return NextResponse.json(
                { success: false, error: 'Restaurant ID and Type are required' },
                { status: 400 }
            )
        }

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
                isActive: isActive ?? true
            }
        })

        await invalidateCache(`dashboard:${restaurantId}`) // Auto refresh for dashboard UI

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
