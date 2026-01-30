import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // 1. Fetch all completed orders with restaurant details
        // We use findMany instead of groupBy to ensure we can easily join Restaurant data
        // (Prisma groupBy doesn't support relation inclusion directly in all versions/modes effectively without separate queries)
        // Actually, let's use groupBy for efficiency if possible, then fetch names.

        // Group by Restaurant for Revenue and Count
        const groupedStats = await prisma.order.groupBy({
            by: ['restaurantId'],
            where: {
                status: { not: 'CANCELLED' } // Only count valid orders
            },
            _sum: {
                totalAmount: true
            },
            _count: {
                id: true
            },
            orderBy: {
                _sum: {
                    totalAmount: 'desc'
                }
            },
            take: 10
        })

        // Fetch Restaurant Details for these IDs
        const restaurantIds = groupedStats.map(s => s.restaurantId)
        const restaurants = await prisma.restaurant.findMany({
            where: { id: { in: restaurantIds } },
            select: { id: true, name: true, slug: true }
        })

        // Map data together
        const leaderboard = groupedStats.map(stat => {
            const r = restaurants.find(res => res.id === stat.restaurantId)
            return {
                id: stat.restaurantId,
                name: r?.name || 'Unknown Restaurant',
                slug: r?.slug || '',
                totalRevenue: stat._sum.totalAmount || 0,
                totalOrders: stat._count.id || 0
            }
        })

        // Top Revenue (already sorted by revenue desc in query)
        const topRevenue = [...leaderboard]

        // Top Selling (sort by order count)
        const topSelling = [...leaderboard].sort((a, b) => b.totalOrders - a.totalOrders)

        return NextResponse.json({
            success: true,
            data: {
                topRevenue: topRevenue.slice(0, 5),
                topSelling: topSelling.slice(0, 5)
            }
        })

    } catch (error) {
        console.error('Admin Analytics Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch admin analytics' }, { status: 500 })
    }
}
