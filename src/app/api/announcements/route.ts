
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/announcements - Fetch active announcements
export async function GET(request: NextRequest) {
    try {
        const activeOnly = request.nextUrl.searchParams.get('active') === 'true'

        const announcements = await prisma.announcement.findMany({
            where: activeOnly ? { isActive: true } : {},
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: announcements })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch announcements' }, { status: 500 })
    }
}

// POST /api/announcements - Create new announcement
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { message } = body

        if (!message) {
            return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
        }

        const announcement = await prisma.announcement.create({
            data: { message, isActive: true }
        })

        return NextResponse.json({ success: true, data: announcement })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create announcement' }, { status: 500 })
    }
}

// DELETE /api/announcements?id=... - Delete/Deactivate
export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get('id')
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

        await prisma.announcement.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 })
    }
}
