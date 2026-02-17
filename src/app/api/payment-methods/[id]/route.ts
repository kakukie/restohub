import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT /api/payment-methods/[id] - Update payment method
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await request.json()
        const { accountNumber, accountName, isActive } = body

        const updated = await prisma.paymentMethod.update({
            where: { id },
            data: {
                accountNumber: accountNumber || null,
                accountName: accountName || null,
                isActive: isActive !== undefined ? isActive : undefined
            }
        })

        return NextResponse.json({
            success: true,
            data: updated
        })
    } catch (error) {
        console.error('Update payment method error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to update payment method'
        }, { status: 500 })
    }
}

// DELETE /api/payment-methods/[id] - Delete payment method
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        await prisma.paymentMethod.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Payment method deleted'
        })
    } catch (error) {
        console.error('Delete payment method error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to delete payment method'
        }, { status: 500 })
    }
}
