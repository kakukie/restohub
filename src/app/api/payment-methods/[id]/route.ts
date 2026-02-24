import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT /api/payment-methods/[id] - Update payment method
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { accountNumber, accountName, isActive } = body

        const updateData: any = {}
        if (accountNumber !== undefined) updateData.accountNumber = accountNumber || null
        if (accountName !== undefined) updateData.accountName = accountName || null
        if (isActive !== undefined) updateData.isActive = isActive

        const updated = await prisma.paymentMethod.update({
            where: { id },
            data: updateData
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

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
