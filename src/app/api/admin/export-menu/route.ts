import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const restaurantId = searchParams.get('restaurantId')
        if (!restaurantId) {
            return NextResponse.json({ success: false, error: 'restaurantId wajib diisi' }, { status: 400 })
        }

        const items = await prisma.menuItem.findMany({
            where: { restaurantId },
            include: { category: true }
        })

        const header = ['name', 'price', 'category', 'description']
        const rows = items.map(i => [
            `"${(i.name || '').replace(/\"/g, '""')}"`,
            i.price ?? '',
            `"${(i.category?.name || '').replace(/\"/g, '""')}"`,
            `"${(i.description || '').replace(/\"/g, '""')}"`
        ].join(','))

        const csv = [header.join(','), ...rows].join('\n')

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="menu-export-${restaurantId}.csv"`
            }
        })
    } catch (error: any) {
        console.error('Export menu error', error)
        return NextResponse.json({ success: false, error: 'Gagal mengekspor data menu' }, { status: 500 })
    }
}
