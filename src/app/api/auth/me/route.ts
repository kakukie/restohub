// ... imports need signAccessToken
import { verifyJwt, signAccessToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    try {
        const roleParam = request.nextUrl.searchParams.get('role')
        const cookieStore = await cookies()

        const adminToken = cookieStore.get('adminToken')?.value
        const restoToken = cookieStore.get('restoToken')?.value

        let token: string | undefined
        let role: string | undefined | null = roleParam

        // Determine context
        if (roleParam === 'SUPER_ADMIN') {
            token = adminToken
        } else if (roleParam === 'RESTAURANT_ADMIN') {
            token = restoToken
        } else {
            // Heuristic
            const lastRole = cookieStore.get('lastRole')?.value
            if (lastRole === 'SUPER_ADMIN' && adminToken) { token = adminToken; role = 'SUPER_ADMIN'; }
            else if (lastRole === 'RESTAURANT_ADMIN' && restoToken) { token = restoToken; role = 'RESTAURANT_ADMIN'; }
            else {
                if (adminToken) { token = adminToken; role = 'SUPER_ADMIN'; }
                else if (restoToken) { token = restoToken; role = 'RESTAURANT_ADMIN'; }
            }
        }

        // 1. Verify Access Token
        let payload: any = token ? await verifyJwt(token) : null

        // 2. If invalid/expired, try Refresh Token
        if (!payload && role) {
            const refreshCookieName = role === 'SUPER_ADMIN' ? 'adminRefreshToken' : 'restoRefreshToken'
            const refreshToken = cookieStore.get(refreshCookieName)?.value

            if (refreshToken) {
                const refreshPayload: any = await verifyJwt(refreshToken)
                if (refreshPayload && refreshPayload.userId) {
                    // Check Database for validity/revocation
                    const dbToken = await prisma.refreshToken.findFirst({
                        where: {
                            token: refreshToken,
                            userId: refreshPayload.userId,
                            revoked: false
                        }
                    })

                    if (dbToken && new Date(dbToken.expiresAt) > new Date()) {
                        // Valid! Issue new Access Token
                        const newPayload = {
                            userId: refreshPayload.userId,
                            email: refreshPayload.email,
                            role: refreshPayload.role,
                            restaurantId: refreshPayload.restaurantId
                        }
                        const newAccessToken = await signAccessToken(newPayload)

                        // Set New Cookie
                        const cookieName = role === 'SUPER_ADMIN' ? 'adminToken' : 'restoToken'
                        cookieStore.set(cookieName, newAccessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                            maxAge: 15 * 60, // 15 mins
                            path: '/'
                        })

                        payload = newPayload
                    }
                }
            }
        }

        if (!payload || !payload.userId) {
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
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
