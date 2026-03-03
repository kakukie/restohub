import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const limitStr = searchParams.get('limit')
        const limit = limitStr ? parseInt(limitStr) : 10

        const logs = await prisma.auditLog.findMany({
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        })

        return NextResponse.json({ success: true, data: logs })
    } catch (error: any) {
        console.error('Failed to fetch audit logs:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, targetType, targetId, details, userId } = body

        if (!action || !targetType) {
            return NextResponse.json({ success: false, error: 'Action and targetType are required' }, { status: 400 })
        }

        const log = await prisma.auditLog.create({
            data: {
                action,
                targetType,
                targetId,
                details: details || null,
                userId: userId || null
            }
        })

        return NextResponse.json({ success: true, data: log })
    } catch (error: any) {
        console.error('Failed to create audit log:', error)
        return NextResponse.json({ success: false, error: 'Failed to log action' }, { status: 500 })
    }
}
