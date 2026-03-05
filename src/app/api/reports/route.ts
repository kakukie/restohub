import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const restaurantId = searchParams.get('restaurantId')
        const yearParam = searchParams.get('year')
        const monthParam = searchParams.get('month')
        const statusParam = searchParams.get('status')

        if (!restaurantId) {
            return NextResponse.json({ success: false, error: 'Restaurant ID required' }, { status: 400 })
        }

        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        let startDate: Date, endDate: Date
        let prevStartDate: Date, prevEndDate: Date

        const granularity = searchParams.get('granularity') || 'day' // day, month, year

        if (startDateParam && endDateParam && startDateParam !== 'undefined' && endDateParam !== 'undefined') {
            const start = new Date(startDateParam)
            const end = new Date(endDateParam)

            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                startDate = start
                endDate = end
                // Adjust end date to end of day
                endDate.setHours(23, 59, 59, 999)

                const duration = endDate.getTime() - startDate.getTime()
                prevStartDate = new Date(startDate.getTime() - duration - 1)
                prevEndDate = new Date(startDate.getTime() - 1)
            } else {
                const now = new Date()
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date()

                prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
            }
        } else {
            const now = new Date()
            const year = yearParam ? parseInt(yearParam) : now.getFullYear()
            const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

            if (granularity === 'day') {
                startDate = new Date(year, month - 1, 1) // Start of current month
                endDate = new Date(year, month, 0, 23, 59, 59) // End of current month

                prevStartDate = new Date(year, month - 2, 1)
                prevEndDate = new Date(year, month - 1, 0, 23, 59, 59)
            } else if (granularity === 'month') {
                startDate = new Date(year, 0, 1) // Start of current year
                endDate = new Date(year, 11, 31, 23, 59, 59) // End of current year

                prevStartDate = new Date(year - 1, 0, 1)
                prevEndDate = new Date(year - 1, 11, 31, 23, 59, 59)
            } else { // year
                startDate = new Date(year - 4, 0, 1) // 5 years ago
                endDate = new Date(year, 11, 31, 23, 59, 59) // End of current year

                prevStartDate = new Date(year - 9, 0, 1)
                prevEndDate = new Date(year - 5, 11, 31, 23, 59, 59)
            }
        }

        // Build Where Clause
        const whereClause: any = {
            restaurantId,
            createdAt: { gte: startDate, lte: endDate }
        }

        if (statusParam && statusParam !== 'ALL') {
            whereClause.status = statusParam
        }

        // 1. Fetch Global Stats with Aggregation
        const orderStats = await prisma.order.aggregate({
            where: {
                ...whereClause,
                status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'] }
            },
            _count: { id: true },
            _sum: { totalAmount: true }
        });

        const completedStats = await prisma.order.aggregate({
            where: { ...whereClause, status: 'COMPLETED' },
            _count: { id: true },
            _sum: { totalAmount: true }
        });

        const cancelledStats = await prisma.order.aggregate({
            where: { ...whereClause, status: 'CANCELLED' },
            _count: { id: true },
            _sum: { totalAmount: true }
        });

        // Fetch Previous Stats
        const prevWhereClause: any = {
            restaurantId,
            createdAt: { gte: prevStartDate, lte: prevEndDate }
        }
        if (statusParam && statusParam !== 'ALL') {
            prevWhereClause.status = statusParam
        }

        const prevOrderStats = await prisma.order.aggregate({
            where: {
                ...prevWhereClause,
                status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'] }
            },
            _count: { id: true },
            _sum: { totalAmount: true }
        });

        const prevCancelledStats = await prisma.order.aggregate({
            where: { ...prevWhereClause, status: 'CANCELLED' },
            _count: { id: true }
        });

        const totalMenuItems = await prisma.menuItem.count({ where: { restaurantId, deletedAt: null } });
        const totalCategories = await prisma.category.count({ where: { restaurantId, deletedAt: null } });

        const calcTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        }

        const stats = {
            totalOrders: orderStats._count.id || 0,
            totalRevenue: orderStats._sum.totalAmount || 0,
            cancelledOrders: cancelledStats._count.id || 0,
            cancelledRevenue: cancelledStats._sum.totalAmount || 0,
            totalMenuItems,
            totalCategories,
            completedOrders: completedStats._count.id || 0,
            averageOrderValue: completedStats._count.id > 0
                ? Math.round((completedStats._sum.totalAmount || 0) / completedStats._count.id)
                : 0,
            trends: {
                orders: calcTrend(orderStats._count.id || 0, prevOrderStats._count.id || 0),
                revenue: calcTrend(orderStats._sum.totalAmount || 0, prevOrderStats._sum.totalAmount || 0),
                cancelled: calcTrend(cancelledStats._count.id || 0, prevCancelledStats._count.id || 0)
            }
        };

        // 2. Fetch Top Menu Items Directly (Simplified for performance)
        // Since Prisma doesn't support complex nested GroupBy with relations perfectly, 
        // we fetch the base joined data with a streamlined query
        const orderItemsGrouped = await prisma.orderItem.groupBy({
            by: ['menuItemId'],
            where: {
                order: {
                    ...whereClause,
                    status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'] }
                }
            },
            _sum: { quantity: true, price: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        // Fetch names for the top items
        const topItemIds = orderItemsGrouped.map(i => i.menuItemId);
        const topMenuItemsData = await prisma.menuItem.findMany({
            where: { id: { in: topItemIds } },
            select: { id: true, name: true }
        });

        const topMenuItems = orderItemsGrouped.map(item => {
            const menuData = topMenuItemsData.find(m => m.id === item.menuItemId);
            return {
                name: menuData?.name || 'Deleted Item',
                count: item._sum.quantity || 0,
                revenue: (item._sum.price || 0) * (item._sum.quantity || 0)
            };
        });

        // 3. Aggregate Top Payment Methods
        const paymentsGrouped = await prisma.payment.groupBy({
            by: ['type'],
            where: {
                order: {
                    ...whereClause,
                    status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'] }
                }
            },
            _count: { id: true },
            _sum: { amount: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        const topPaymentMethods = paymentsGrouped.map(p => ({
            name: p.type,
            count: p._count.id || 0,
            revenue: p._sum.amount || 0
        }));

        // 4. Generate Daily Data for Chart (Using efficient select instead of full include)
        const relevantOrders = await prisma.order.findMany({
            where: {
                ...whereClause,
                status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'] }
            },
            select: {
                createdAt: true,
                totalAmount: true
            }
        });

        const chartData: Record<string, { count: number, revenue: number }> = {}

        // Helper to format date key
        const getKey = (date: Date, type: string) => {
            if (type === 'year') return date.getFullYear().toString()
            if (type === 'month') return date.toISOString().slice(0, 7) // YYYY-MM
            return date.toISOString().split('T')[0] // YYYY-MM-DD
        }

        if (granularity === 'day') {
            const loopDate = new Date(startDate);
            while (loopDate <= endDate) {
                const dateKey = loopDate.toISOString().split('T')[0];
                chartData[dateKey] = { count: 0, revenue: 0 };
                loopDate.setDate(loopDate.getDate() + 1);
            }
        } else if (granularity === 'month') {
            const loopDate = new Date(startDate);
            loopDate.setDate(1)
            while (loopDate <= endDate) {
                const dateKey = getKey(loopDate, 'month')
                chartData[dateKey] = { count: 0, revenue: 0 }
                loopDate.setMonth(loopDate.getMonth() + 1)
            }
        } else if (granularity === 'year') {
            const loopDate = new Date(startDate);
            loopDate.setMonth(0, 1) // Jan 1st
            while (loopDate <= endDate) {
                const dateKey = getKey(loopDate, 'year')
                chartData[dateKey] = { count: 0, revenue: 0 }
                loopDate.setFullYear(loopDate.getFullYear() + 1)
            }
        }

        relevantOrders.forEach(o => {
            const d = new Date(o.createdAt)
            const dateKey = getKey(d, granularity)

            if (!chartData[dateKey]) {
                chartData[dateKey] = { count: 0, revenue: 0 }
            }

            chartData[dateKey].count++
            chartData[dateKey].revenue += (o.totalAmount || 0)
        })

        return NextResponse.json({
            success: true,
            data: {
                stats,
                chartData,
                topMenuItems,
                topPaymentMethods
            }
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            }
        })

    } catch (error) {
        console.error('Report Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 })
    }
}
