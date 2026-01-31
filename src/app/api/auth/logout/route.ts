import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get('refreshToken')?.value

        if (refreshToken) {
            // Mark as revoked in DB
            // Use updateMany to safely handle non-existent case without throwing
            await prisma.refreshToken.updateMany({
                where: { token: refreshToken },
                data: { revoked: true }
            })
        }

        const role = request.nextUrl.searchParams.get('role')

        if (role === 'SUPER_ADMIN') {
            cookieStore.delete('adminToken')
            cookieStore.delete('adminRefreshToken')
            // If lastRole was this, maybe clear it? Or let it be overwritten next login.
            // cookieStore.delete('lastRole') 
        } else if (role === 'RESTAURANT_ADMIN') {
            cookieStore.delete('restoToken')
            cookieStore.delete('restoRefreshToken')
        } else {
            // Clear All
            cookieStore.delete('accessToken')
            cookieStore.delete('refreshToken')
            cookieStore.delete('adminToken')
            cookieStore.delete('restoToken')
            cookieStore.delete('adminRefreshToken')
            cookieStore.delete('restoRefreshToken')
            cookieStore.delete('lastRole')
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
