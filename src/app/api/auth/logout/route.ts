import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const role = request.nextUrl.searchParams.get('role')

        let refreshTokenToRevoke: string | undefined

        // Determine which token to revoke based on role
        if (role === 'SUPER_ADMIN') {
            refreshTokenToRevoke = cookieStore.get('adminRefreshToken')?.value
            cookieStore.delete('adminToken')
            cookieStore.delete('adminRefreshToken')
        } else if (role === 'RESTAURANT_ADMIN') {
            refreshTokenToRevoke = cookieStore.get('restoRefreshToken')?.value
            cookieStore.delete('restoToken')
            cookieStore.delete('restoRefreshToken')
        } else {
            // Fallback for generic logout
            refreshTokenToRevoke = cookieStore.get('refreshToken')?.value
            // Clear All known cookies to be safe
            cookieStore.delete('accessToken')
            cookieStore.delete('refreshToken')
            cookieStore.delete('adminToken')
            cookieStore.delete('restoToken')
            cookieStore.delete('adminRefreshToken')
            cookieStore.delete('restoRefreshToken')
            cookieStore.delete('lastRole')
        }

        if (refreshTokenToRevoke) {
            // Mark as revoked in DB
            await prisma.refreshToken.updateMany({
                where: { token: refreshTokenToRevoke },
                data: { revoked: true }
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        })
    } catch (error: any) {
        console.error('Logout Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
