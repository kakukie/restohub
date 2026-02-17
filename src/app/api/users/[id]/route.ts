import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE /api/users/[id] - Delete user (soft delete if has orders, hard delete otherwise)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        // Check if user has orders
        const userWithOrders = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        })

        if (!userWithOrders) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 })
        }

        // If user has orders, soft delete
        if (userWithOrders._count.orders > 0) {
            await prisma.user.update({
                where: { id },
                data: { deletedAt: new Date() }
            })

            return NextResponse.json({
                success: true,
                message: `User soft deleted (has ${userWithOrders._count.orders} orders)`
            })
        }

        // If no orders, hard delete
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'User deleted'
        })
    } catch (error) {
        console.error('Delete user error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to delete user'
        }, { status: 500 })
    }
}
