
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/settings - Fetch global system settings (publicly safe subset)
export async function GET(request: NextRequest) {
    try {
        const settings = await prisma.systemSetting.findMany()
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>)

        return NextResponse.json({
            success: true,
            data: {
                whatsapp: settingsMap['helpdesk_whatsapp'] || '6281234567890',
                email: settingsMap['helpdesk_email'] || 'support@meenuin.biz.id',
                maintenanceMode: settingsMap['maintenance_mode'] === 'true',
                platformName: settingsMap['platform_name'] || 'Meenuin',
                // Payment settings
                bankName: settingsMap['bank_name'] || '',
                bankAccountNumber: settingsMap['bank_account_number'] || '',
                bankAccountName: settingsMap['bank_account_name'] || '',
                qrisImageUrl: settingsMap['qris_image_url'] || '',
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
        const {
            whatsapp, email, maintenanceMode, platformName,
            bankName, bankAccountNumber, bankAccountName, qrisImageUrl
        } = body

        const upsertSetting = async (key: string, value: string | undefined | boolean) => {
            if (value === undefined) return
            const v = String(value)
            await prisma.systemSetting.upsert({
                where: { key },
                update: { value: v },
                create: { key, value: v }
            })
        }

        await upsertSetting('helpdesk_whatsapp', whatsapp)
        await upsertSetting('helpdesk_email', email)
        await upsertSetting('maintenance_mode', maintenanceMode !== undefined ? String(maintenanceMode) : undefined)
        await upsertSetting('platform_name', platformName)
        await upsertSetting('bank_name', bankName)
        await upsertSetting('bank_account_number', bankAccountNumber)
        await upsertSetting('bank_account_name', bankAccountName)
        await upsertSetting('qris_image_url', qrisImageUrl)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update Settings Error', error)
        return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
    }
}
