
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/settings - Fetch global system settings (publicly safe subset)
export async function GET(request: NextRequest) {
    try {
        const settings = await prisma.systemSetting.findMany()
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>)

        // Return default values if not set
        return NextResponse.json({
            success: true,
            data: {
                whatsapp: settingsMap['helpdesk_whatsapp'] || '6281234567890',
                email: settingsMap['helpdesk_email'] || 'support@meenuin.biz.id',
                maintenanceMode: settingsMap['maintenance_mode'] === 'true',
                platformName: settingsMap['platform_name'] || 'RestoHub'
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
        const { whatsapp, email, maintenanceMode, platformName } = body

        if (whatsapp !== undefined) {
            await prisma.systemSetting.upsert({
                where: { key: 'helpdesk_whatsapp' },
                update: { value: whatsapp },
                create: { key: 'helpdesk_whatsapp', value: whatsapp }
            })
        }

        if (email !== undefined) {
            await prisma.systemSetting.upsert({
                where: { key: 'helpdesk_email' },
                update: { value: email },
                create: { key: 'helpdesk_email', value: email }
            })
        }

        if (maintenanceMode !== undefined) {
            await prisma.systemSetting.upsert({
                where: { key: 'maintenance_mode' },
                update: { value: String(maintenanceMode) },
                create: { key: 'maintenance_mode', value: String(maintenanceMode) }
            })
        }

        if (platformName !== undefined) {
            await prisma.systemSetting.upsert({
                where: { key: 'platform_name' },
                update: { value: platformName },
                create: { key: 'platform_name', value: platformName }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update Settings Error', error)
        return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
    }
}
