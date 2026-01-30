import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJwt } from '@/lib/jwt'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const roleParam = request.nextUrl.searchParams.get('role')
        const cookieStore = await cookies()

        const adminToken = cookieStore.get('adminToken')?.value
        const restoToken = cookieStore.get('restoToken')?.value

        let token: string | undefined

        if (roleParam === 'SUPER_ADMIN') {
            token = adminToken
        } else if (roleParam === 'RESTAURANT_ADMIN') {
            token = restoToken
        } else {
            // Priority: Admin > Resto (or check lastRole cookie?)
            const lastRole = cookieStore.get('lastRole')?.value
            if (lastRole === 'SUPER_ADMIN' && adminToken) token = adminToken
            else if (lastRole === 'RESTAURANT_ADMIN' && restoToken) token = restoToken
            else token = adminToken || restoToken
        }

        if (!token) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
        }

        const payload = await verifyJwt(token)
        if (!payload || !payload.userId) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId as string },
            include: {
                restaurants: true
            }
        })

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
        }

        // Optional: Re-check restaurant status if Resto Admin
        const restaurant = user.restaurants[0]
        if (user.role === 'RESTAURANT_ADMIN' && restaurant) {
            if (!restaurant.isActive || restaurant.status === 'REJECTED') {
                return NextResponse.json({ success: false, error: 'Account inactive' }, { status: 403 })
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                restaurantId: restaurant?.id,
            }
        })

    } catch (error) {
        console.error('Session Check Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
