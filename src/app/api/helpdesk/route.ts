import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJwt } from '@/lib/jwt'
import { cookies } from 'next/headers'

// GET /api/helpdesk
export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const adminToken = cookieStore.get('adminToken')?.value
        const restoToken = cookieStore.get('restoToken')?.value

        let token = adminToken || restoToken
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const payload: any = await verifyJwt(token)
        if (!payload || !payload.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const restaurantIdParam = request.nextUrl.searchParams.get('restaurantId')

        // If Restaurant Admin, only fetch their own messages
        if (payload.role === 'RESTAURANT_ADMIN') {
            if (!payload.restaurantId) {
                return NextResponse.json({ success: false, error: 'No restaurant associated' }, { status: 403 })
            }
            const messages = await prisma.helpdeskMessage.findMany({
                where: { restaurantId: payload.restaurantId },
                orderBy: { createdAt: 'asc' },
                include: { restaurant: { select: { name: true } } }
            })
            return NextResponse.json({ success: true, messages })
        }

        // If Super Admin, fetch messages for specific restaurant or all
        if (payload.role === 'SUPER_ADMIN') {
            if (restaurantIdParam) {
                const messages = await prisma.helpdeskMessage.findMany({
                    where: { restaurantId: restaurantIdParam },
                    orderBy: { createdAt: 'asc' },
                    include: { restaurant: { select: { name: true } } }
                })
                return NextResponse.json({ success: true, messages })
            } else {
                // Return latest message per restaurant for the admin inbox view
                // Since prisma doesn't support distinct on relations easily with latest, we can fetch all and group, or just fetch recent active chats
                const allMessages = await prisma.helpdeskMessage.findMany({
                    orderBy: { createdAt: 'desc' },
                    include: { restaurant: { select: { name: true } } }
                })
                return NextResponse.json({ success: true, messages: allMessages })
            }
        }

        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    } catch (error: any) {
        console.error('Helpdesk GET Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/helpdesk
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const adminToken = cookieStore.get('adminToken')?.value
        const restoToken = cookieStore.get('restoToken')?.value

        let token = adminToken || restoToken
        if (!token) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const payload: any = await verifyJwt(token)
        if (!payload || !payload.userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { message, attachment, restaurantId } = body

        if (!message && !attachment) {
            return NextResponse.json({ success: false, error: 'Message or attachment required' }, { status: 400 })
        }

        let targetRestaurantId = restaurantId

        if (payload.role === 'RESTAURANT_ADMIN') {
            targetRestaurantId = payload.restaurantId
        }

        if (!targetRestaurantId) {
            return NextResponse.json({ success: false, error: 'Restaurant ID required' }, { status: 400 })
        }

        const newMessage = await prisma.helpdeskMessage.create({
            data: {
                restaurantId: targetRestaurantId,
                senderRole: payload.role,
                message: message || '',
                attachment: attachment || null,
            },
            include: {
                restaurant: { select: { name: true } }
            }
        })

        return NextResponse.json({ success: true, message: newMessage })

    } catch (error: any) {
        console.error('Helpdesk POST Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
