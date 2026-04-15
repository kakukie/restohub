import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Auth: Super Admin only
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

        // Group by Restaurant for Revenue and Count
        const groupedStats = await prisma.order.groupBy({
            by: ['restaurantId'],
            where: {
                status: { not: 'CANCELLED' }
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

        // Calculate Global Stats
        const globalOrderStats = await prisma.order.aggregate({
            where: {
                status: { not: 'CANCELLED' }
            },
            _sum: {
                totalAmount: true
            },
            _count: {
                id: true
            }
        })

        const activeRestaurants = await prisma.restaurant.count({
            where: { status: 'ACTIVE', isActive: true, deletedAt: null }
        })

        const pendingRestaurants = await prisma.restaurant.count({
            where: { status: 'PENDING', deletedAt: null }
        })

        return NextResponse.json({
            success: true,
            data: {
                topRevenue: topRevenue.slice(0, 5),
                topSelling: topSelling.slice(0, 5),
                globalStats: {
                    totalRevenue: globalOrderStats._sum.totalAmount || 0,
                    totalOrders: globalOrderStats._count.id || 0,
                    activeRestaurants: activeRestaurants,
                    pendingApproval: pendingRestaurants
                }
            }
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            }
        })

    } catch (error) {
        console.error('Admin Analytics Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch admin analytics' }, { status: 500 })
    }
}
