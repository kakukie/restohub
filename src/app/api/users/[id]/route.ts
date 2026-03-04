import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE /api/users/[id] - Delete user (soft delete if has orders, hard delete otherwise)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ success: false, error: 'Valid User ID required' }, { status: 400 })
        }

        // Check for existing orders before deletion
        const user = await prisma.user.findUnique({
            where: { id },
            include: { _count: { select: { orders: true } } }
        })

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
        }

        // Soft delete if has orders, hard delete otherwise
        if (user._count.orders > 0) {
            await prisma.user.update({
                where: { id },
                data: { deletedAt: new Date(), password: '' }
            })
            return NextResponse.json({ success: true, message: `User soft-deleted (has ${user._count.orders} orders)` })
        } else {
            await prisma.user.delete({
                where: { id }
            })
            return NextResponse.json({ success: true, message: 'User permanent-deleted' })
        }
    } catch (error: any) {
        console.error('Delete User Error:', error)
        return NextResponse.json({ success: false, error: error.message || 'Failed to delete user' }, { status: 500 })
    }
}
