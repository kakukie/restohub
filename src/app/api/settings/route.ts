
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/settings - Fetch global system settings (publicly safe subset)
export async function GET(request: NextRequest) {
    try {
        const settings = await prisma.systemSetting.findMany()
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})

        // Return default values if not set
        return NextResponse.json({
            success: true,
            data: {
                whatsapp: settingsMap['helpdesk_whatsapp'] || '6281234567890',
                email: settingsMap['helpdesk_email'] || 'support@meenuin.biz.id'
            }
        })
    } catch (error) {
        console.error('Fetch Settings Error', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
    }
}

// PUT /api/settings - Update global system settings (Admin only)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { whatsapp, email } = body

        if (whatsapp) {
            await prisma.systemSetting.upsert({
                where: { key: 'helpdesk_whatsapp' },
                update: { value: whatsapp },
                create: { key: 'helpdesk_whatsapp', value: whatsapp }
            })
        }

        if (email) {
            await prisma.systemSetting.upsert({
                where: { key: 'helpdesk_email' },
                update: { value: email },
                create: { key: 'helpdesk_email', value: email }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update Settings Error', error)
        return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
    }
}
