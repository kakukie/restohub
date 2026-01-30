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

        // Clear Cookies
        cookieStore.delete('accessToken')
        cookieStore.delete('refreshToken')

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
