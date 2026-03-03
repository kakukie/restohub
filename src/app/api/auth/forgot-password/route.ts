import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/mail'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (!user) {
            // Return success even if not found to prevent email enumeration
            return NextResponse.json({ success: true, message: 'If that email is registered, we sent a password reset link to it.' })
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 Hour

        // Save token to user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetTokenExpiry
            }
        })

        // Send Email
        const mailResult = await sendPasswordResetEmail(user.email, resetToken)

        if (!mailResult?.success) {
            console.error("Mail send failed", mailResult?.error)
            // Depending on architecture, you might still return 200, but let's notify the client it failed
            return NextResponse.json({ success: false, error: 'Failed to send reset email. Please try again later or contact support.' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'If that email is registered, we sent a password reset link to it.'
        })

    } catch (error: any) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process request' },
            { status: 500 }
        )
    }
}
