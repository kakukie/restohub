import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { token, newPassword } = body

        if (!token || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Token and new password are required' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Find user with this token and ensure it's not expired
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date()
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired password reset token' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update user, clearing out reset tokens
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully. You can now log in.'
        })
    } catch (error: any) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process request' },
            { status: 500 }
        )
    }
}
