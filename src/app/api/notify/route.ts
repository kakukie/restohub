import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { sendApproveRestaurantEmail, sendRejectRestaurantEmail } from '@/lib/mail'
import { getAuthenticatedUser } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
    try {
        // Auth: Super Admin only — prevent abuse as email spam relay
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

        const body = await request.json()
        const { type, recipient, message, subject, restaurantName } = body

        if (!type || !recipient) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        // Validate email format for email types
        if ((type === 'EMAIL' || type === 'APPROVE_RESTAURANT' || type === 'REJECT_RESTAURANT') && 
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
            return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 })
        }

        let result
        if (type === 'APPROVE_RESTAURANT') {
            result = await sendApproveRestaurantEmail(recipient, restaurantName || 'Restoran Anda')
        } else if (type === 'REJECT_RESTAURANT') {
            result = await sendRejectRestaurantEmail(recipient, restaurantName || 'Restoran Anda')
        } else if (type === 'EMAIL') {
            if (!message) return NextResponse.json({ success: false, error: 'Message required for EMAIL type' }, { status: 400 })
            const emailSubject = subject || 'Notification from Meenuin'
            const html = `<div style="font-family: sans-serif; padding: 20px;">
              <h2>Notification</h2>
              <p>${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <hr/>
              <p style="font-size: 12px; color: gray;">${new Date().toLocaleString()}</p>
            </div>`
            result = await sendEmail(recipient, emailSubject, html)
        } else if (type === 'WHATSAPP') {
            console.log(`[WHATSAPP] To: ${recipient}, Msg: ${message}`)
            result = { success: true, mocked: true, note: 'WhatsApp requires API Key' }
        }

        return NextResponse.json({
            success: true,
            message: `Notification processed for ${recipient}`,
            data: result
        })
    } catch (error) {
        console.error('Notification Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
