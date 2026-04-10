import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from '@/lib/rateLimiter'

const DEMO_EMAIL = 'demo@restohub.id'
const DEMO_PASSWORD = 'demo1234'

export async function POST(request: NextRequest) {
    try {
        // Rate limit per IP — shared with login limiter
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
            || request.headers.get('x-real-ip')
            || '0.0.0.0'

        const rateLimitResult = await checkRateLimit(ip, DEMO_EMAIL)
        if (!rateLimitResult.allowed) {
            const retryMins = Math.ceil((rateLimitResult.retryAfterSeconds ?? 60) / 60)
            return NextResponse.json(
                { success: false, error: `Demo dibatasi sementara. Coba lagi dalam ${retryMins} menit.` },
                { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfterSeconds ?? 60) } }
            )
        }

        // Find demo user
        const user = await prisma.user.findUnique({
            where: { email: DEMO_EMAIL },
            include: { restaurants: true }
        })

        if (!user || !user.password || user.role !== 'RESTAURANT_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Akun demo tidak ditemukan. Hubungi administrator.' },
                { status: 404 }
            )
        }

        // Verify demo password matches DB (ensures seed has been run correctly)
        const isValid = await comparePassword(DEMO_PASSWORD, user.password)
        if (!isValid) {
            await recordFailedAttempt(ip, DEMO_EMAIL)
            return NextResponse.json(
                { success: false, error: 'Konfigurasi demo tidak valid. Hubungi administrator.' },
                { status: 401 }
            )
        }

        await clearRateLimit(ip, DEMO_EMAIL)

        const restaurant = user.restaurants.find(r => !r.deletedAt) ?? user.restaurants[0]

        if (!restaurant || !restaurant.isActive) {
            return NextResponse.json(
                { success: false, error: 'Restaurant demo tidak ditemukan.' },
                { status: 404 }
            )
        }

        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            restaurantId: restaurant.id,
            isDemo: true
        }

        const accessToken = await signAccessToken(tokenPayload)
        const refreshToken = await signRefreshToken(tokenPayload)

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        })

        const cookieStore = await cookies()
        cookieStore.set('restoToken', accessToken, {
            httpOnly: true,
            secure: process.env.USE_SECURE_COOKIES === 'true',
            sameSite: 'lax',
            maxAge: 15 * 60,
            path: '/'
        })
        cookieStore.set('restoRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.USE_SECURE_COOKIES === 'true',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/'
        })
        cookieStore.set('lastRole', user.role, { path: '/' })

        return NextResponse.json({
            success: true,
            message: 'Demo login berhasil',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantId: restaurant.id,
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
