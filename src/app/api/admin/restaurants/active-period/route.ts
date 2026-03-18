import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(request: NextRequest) {
    try {
        const { restaurantId, activeUntil } = await request.json()
        if (!restaurantId || !activeUntil) {
            return NextResponse.json({ success: false, error: 'restaurantId dan activeUntil wajib diisi' }, { status: 400 })
        }

        const updated = await prisma.restaurant.update({
            where: { id: restaurantId },
            data: { activeUntil: new Date(activeUntil) }
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error: any) {
        console.error('Update active period error:', error)
        return NextResponse.json({ success: false, error: 'Gagal mengubah masa aktif' }, { status: 500 })
    }
}
