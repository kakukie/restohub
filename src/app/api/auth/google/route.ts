import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signAccessToken, signRefreshToken, signPreAuthToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { credential } = body

        if (!credential) {
            return NextResponse.json({ success: false, error: 'Token Google tidak ditemukan' }, { status: 400 })
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        })
        const payload = ticket.getPayload()
        
        if (!payload || !payload.email) {
            return NextResponse.json({ success: false, error: 'Gagal mendapatkan data akun Google' }, { status: 400 })
        }

        const email = payload.email

        const user = await prisma.user.findUnique({
            where: { email },
            include: { restaurants: true }
        })

        if (!user || user.deletedAt) {
            // Berdasarkan feedback user: tampilkan error, jangan redirect otomatis ke Register.
            return NextResponse.json({ 
                success: false, 
                error: 'Sistem mengenali kredensial Google Anda, namun email ini tidak terdaftar sebagai Admin Resto. Silahkan hubungi Support.' 
            }, { status: 401 })
        }

        // Jika dia bukan RESTAURANT_ADMIN atau SUPER_ADMIN (asumsi customer) tapi login via admin
        if (user.role === 'CUSTOMER') {
            return NextResponse.json({ success: false, error: 'Email ini tidak terdaftar sebagai Admin Resto.' }, { status: 403 })
        }

        const restaurant = user.restaurants.find(r => !r.deletedAt) ?? user.restaurants[0]
        
        if (user.role === 'RESTAURANT_ADMIN' && restaurant) {
            if (restaurant.status === 'PENDING') {
                return NextResponse.json({ success: false, error: 'Akun restoran Anda masih menunggu persetujuan.' }, { status: 403 })
            }
            if (restaurant.status === 'REJECTED' || !restaurant.isActive) {
                return NextResponse.json({ success: false, error: 'Akun restoran Anda tidak aktif.' }, { status: 403 })
            }
        }

        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            restaurantId: restaurant?.id
        }

        // Logic 2FA
        if ((user as any).isTwoFactorEnabled && (user as any).twoFactorSecret) {
            const preAuthToken = await signPreAuthToken(tokenPayload)
            return NextResponse.json({
                success: true,
                message: 'Verifikasi 2FA dibutuhkan',
                requires2FA: true,
                preAuthToken
            })
        }

        // Langsung generate token utama jika tidak ada 2FA
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
                restaurantId: restaurant?.id,
                accessToken
            }
        })

    } catch (error: any) {
        console.error('Google SSO Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
