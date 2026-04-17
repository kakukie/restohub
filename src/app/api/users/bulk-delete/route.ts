import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('adminToken')?.value
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const payload = await verifyAccessToken(token)
        if (!payload || payload.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { ids } = await request.json()
        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ success: false, error: 'Invalid IDs' }, { status: 400 })
        }

        // Hard delete users (or soft delete by setting deletedAt)
        await prisma.user.updateMany({
            where: { id: { in: ids } },
            data: { deletedAt: new Date() }
        })

        // Log the action
        await prisma.auditLog.create({
            data: {
                action: 'BULK_DELETE_USERS',
                userId: payload.userId,
                targetType: 'USER',
                details: { count: ids.length, ids }
            }
        })

        return NextResponse.json({ success: true, message: `${ids.length} users deleted.` })

    } catch (error: any) {
        console.error('Bulk Delete Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
