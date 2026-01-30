import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signAccessToken, verifyJwt } from '@/lib/jwt'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get('refreshToken')?.value

        if (!refreshToken) {
            return NextResponse.json(
                { success: false, error: 'No refresh token found' },
                { status: 401 }
            )
        }

        // Verify Payload
        const payload = await verifyJwt(refreshToken)
        if (!payload) {
            return NextResponse.json(
                { success: false, error: 'Invalid token signature' },
                { status: 401 }
            )
        }

        // Verify in Database
        const savedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: { include: { restaurants: true } } }
        })

        if (!savedToken || savedToken.revoked) {
            // Potential Reuse attack ? Revoke all user tokens if needed.
            return NextResponse.json(
                { success: false, error: 'Invalid or revoked token' },
                { status: 401 }
            )
        }

        if (savedToken.expiresAt < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Token expired' },
                { status: 401 }
            )
        }

        // Generate New Access Token
        const user = savedToken.user
        const restaurant = user.restaurants[0]

        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            restaurantId: restaurant?.id
        }

        const newAccessToken = await signAccessToken(tokenPayload)

        // Set New Cookie
        cookieStore.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 mins
            path: '/'
        })

        // Optionally rotate refresh token here, but keeping it simple as per user request to just "fix" it first.

        return NextResponse.json({
            success: true,
            accessToken: newAccessToken
        })

    } catch (error: any) {
        console.error('Refresh Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
