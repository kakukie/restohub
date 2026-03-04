import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { sendApproveRestaurantEmail, sendRejectRestaurantEmail } from '@/lib/mail'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, recipient, message, subject, restaurantName } = body

        if (!type || !recipient) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
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
              <p>${message}</p>
              <hr/>
              <p style="font-size: 12px; color: gray;">${new Date().toLocaleString()}</p>
            </div>`
            result = await sendEmail(recipient, emailSubject, html)
        } else if (type === 'WHATSAPP') {
            // WhatsApp requires paid API. Logging for "Real" attempt.
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
