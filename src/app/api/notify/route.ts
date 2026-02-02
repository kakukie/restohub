import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, recipient, message } = body

        if (!type || !recipient || !message) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        // Simulate sending notification
        console.log(`[NOTIFICATION] Sending ${type} to ${recipient}: ${message}`)

        // reliable delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 500))

        return NextResponse.json({
            success: true,
            message: `Notification sent to ${recipient}`,
            data: { type, recipient, timestamp: new Date().toISOString() }
        })
    } catch (error) {
        console.error('Notification Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
