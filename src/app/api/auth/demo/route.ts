import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const demoEmail = 'demo@meenuin.com'

        // 1. Find the Demo User
        let user: any = await prisma.user.findUnique({
            where: { email: demoEmail },
            include: { restaurants: true }
        })

        // 2. If it doesn't exist, this is the first run. Create the demo user & restaurant
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: 'Demo Admin',
                    email: demoEmail,
                    password: 'demo_password_not_used', // We bypass password check anyway
                    role: 'RESTAURANT_ADMIN',
                    phone: '081234567890',
                    restaurants: {
                        create: {
                            name: 'Demo Restaurant',
                            slug: 'demo-resto',
                            description: 'This is a demo restaurant for testing purposes.',
                            address: 'Jl. Sudirman No 1',
                            status: 'ACTIVE',
                            isActive: true,
                            phone: '081234567890',
                        }
                    }
                },
                include: { restaurants: true }
            })
        }

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Failed to find or create demo user' },
                { status: 500 }
            )
        }

        const restaurant = user.restaurants?.[0]

        // 3. Generate Tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            restaurantId: restaurant?.id
        }

        const accessToken = await signAccessToken(tokenPayload)
        const refreshToken = await signRefreshToken(tokenPayload)

        // 4. Store Refresh Token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            }
        })

        // 5. Set Cookies
        const cookieStore = await cookies()

        cookieStore.set('restoToken', accessToken, {
            httpOnly: true,
            secure: process.env.USE_SECURE_COOKIES === 'true',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 mins
            path: '/'
        })

        cookieStore.set('restoRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.USE_SECURE_COOKIES === 'true',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/'
        })

        cookieStore.set('lastRole', user.role, { path: '/' })

        // 6. Return standard login response
        return NextResponse.json({
            success: true,
            message: 'Demo Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantId: restaurant?.id,
                accessToken
            }
        })

    } catch (error: any) {
        console.error('Demo Login Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
