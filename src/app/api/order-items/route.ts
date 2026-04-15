import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
        return NextResponse.json({ success: false, error: 'Restaurant ID required' }, { status: 400 })
    }

    // IDOR Protection: Ensure user owns this restaurant or is Super Admin
    if (user.role !== 'SUPER_ADMIN' && user.restaurantId !== restaurantId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    try {
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    restaurantId: restaurantId
                }
            },
            include: {
                order: {
                    select: { status: true }
                }
            }
        })

        return NextResponse.json({ success: true, data: orderItems })
    } catch (error) {
        console.error('Error fetching order items:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
