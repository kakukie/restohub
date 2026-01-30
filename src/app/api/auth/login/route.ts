import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and Password are required' },
                { status: 400 }
            )
        }

        // Find User
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                restaurants: true
            }
        })

        if (!user || !user.password) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Check Password
        const isValid = await comparePassword(password, user.password)
        if (!isValid) {
            return NextResponse.json(
                { success: false, error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Retrieve the first restaurant
        const restaurant = user.restaurants[0]

        // Check Restaurant Status
        if (user.role === 'RESTAURANT_ADMIN' && restaurant) {
            if (restaurant.status === 'PENDING') {
                return NextResponse.json(
                    { success: false, error: 'Account pending approval. Please wait for admin verification.' },
                    { status: 403 }
                )
            }
            if (restaurant.status === 'REJECTED' || !restaurant.isActive) {
                return NextResponse.json(
                    { success: false, error: 'Account is inactive or suspended.' },
                    { status: 403 }
                )
            }
        }

        // Generate Tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            restaurantId: restaurant?.id
        }

        const accessToken = await signAccessToken(tokenPayload)
        const refreshToken = await signRefreshToken(tokenPayload)

        // Store Refresh Token in Database
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            }
        })

        // Determine Cookie Name based on Role
        const cookieName = user.role === 'SUPER_ADMIN' ? 'adminToken' : 'restoToken'
        const refreshCookieName = user.role === 'SUPER_ADMIN' ? 'adminRefreshToken' : 'restoRefreshToken'

        // Set Cookies
        const cookieStore = await cookies()
        cookieStore.set(cookieName, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 mins
            path: '/'
        })

        cookieStore.set(refreshCookieName, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/'
        })

        // Also set a generic 'userRole' cookie for client-side redirection hints
        cookieStore.set('lastRole', user.role, { path: '/' })

        // Construct response data
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            restaurantId: restaurant?.id,
            accessToken
        }

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: userData
        })

    } catch (error: any) {
        console.error('Login Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
