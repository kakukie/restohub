import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { restaurantId, csv } = body

        if (!restaurantId || !csv) {
            return NextResponse.json({ success: false, error: 'restaurantId dan csv wajib diisi' }, { status: 400 })
        }

        const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0)
        if (lines.length < 2) {
            return NextResponse.json({ success: false, error: 'CSV kosong atau tidak ada data' }, { status: 400 })
        }

        const [headerLine, ...rows] = lines
        const headers = headerLine.toLowerCase().split(',').map(h => h.trim())
        const idxName = headers.indexOf('name')
        const idxPrice = headers.indexOf('price')
        const idxCategory = headers.indexOf('category')
        const idxDesc = headers.indexOf('description')

        const createdItems: any[] = []

        for (const row of rows) {
            const cols = row.split(',').map(c => c.replace(/^\"|\"$/g, ''))
            const name = cols[idxName] || ''
            const price = parseFloat(cols[idxPrice] || '0')
            const categoryName = cols[idxCategory] || 'Uncategorized'
            const description = idxDesc >= 0 ? cols[idxDesc] : ''

            if (!name) continue

            // ensure category exists
            let category = await prisma.category.findFirst({
                where: { restaurantId, name: categoryName }
            })
            if (!category) {
                category = await prisma.category.create({
                    data: {
                        restaurantId,
                        name: categoryName,
                        description: ''
                    }
                })
            }

            const item = await prisma.menuItem.create({
                data: {
                    restaurantId,
                    categoryId: category.id,
                    name,
                    price,
                    description,
                    isAvailable: true
                }
            })
            createdItems.push(item)
        }

        return NextResponse.json({ success: true, data: { count: createdItems.length } })
    } catch (error: any) {
        console.error('Import menu error', error)
        return NextResponse.json({ success: false, error: 'Gagal mengimpor data menu' }, { status: 500 })
    }
}
