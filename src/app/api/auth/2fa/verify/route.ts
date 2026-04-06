import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJwt, signAccessToken, signRefreshToken } from '@/lib/jwt'
import { authenticator } from 'otplib'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { preAuthToken, token: otpToken } = body

        if (!preAuthToken || !otpToken) {
            return NextResponse.json({ success: false, error: 'Token tidak lengkap' }, { status: 400 })
        }

        const decoded = await verifyJwt(preAuthToken)
        if (!decoded || !decoded.preAuth || !decoded.userId) {
            return NextResponse.json({ success: false, error: 'Sesi tidak valid atau kadaluarsa' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        })

        if (!user || user.deletedAt) {
            return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 })
        }

        const { twoFactorSecret, isTwoFactorEnabled } = user as any
        if (!twoFactorSecret || !isTwoFactorEnabled) {
            return NextResponse.json({ success: false, error: '2FA tidak aktif untuk user ini' }, { status: 400 })
        }

        const isValid = authenticator.verify({ token: otpToken, secret: twoFactorSecret })
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Kode OTP tidak valid' }, { status: 400 })
        }

        // Generate Tokens
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            restaurantId: decoded.restaurantId
        }

        const accessToken = await signAccessToken(tokenPayload)
        const refreshToken = await signRefreshToken(tokenPayload)

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt }
        })

        const cookieName = user.role === 'SUPER_ADMIN' ? 'adminToken' : 'restoToken'
        const refreshCookieName = user.role === 'SUPER_ADMIN' ? 'adminRefreshToken' : 'restoRefreshToken'

        const cookieStore = await cookies()
        cookieStore.set(cookieName, accessToken, {
            httpOnly: true, secure: process.env.USE_SECURE_COOKIES === 'true', sameSite: 'lax', maxAge: 15 * 60, path: '/'
        })
        cookieStore.set(refreshCookieName, refreshToken, {
            httpOnly: true, secure: process.env.USE_SECURE_COOKIES === 'true', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/'
        })
        cookieStore.set('lastRole', user.role, { path: '/' })

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantId: decoded.restaurantId,
                accessToken
            }
        })

    } catch (error: any) {
        console.error('2FA Verify Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
