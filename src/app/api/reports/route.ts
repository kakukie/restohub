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

        const granularity = searchParams.get('granularity') || 'day' // day, month, year

        if (startDateParam && endDateParam && startDateParam !== 'undefined' && endDateParam !== 'undefined') {
            const start = new Date(startDateParam)
            const end = new Date(endDateParam)

            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                startDate = start
                endDate = end
                // Adjust end date to end of day
                endDate.setHours(23, 59, 59, 999)
            } else {
                const now = new Date()
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date()
            }
        } else {
            const now = new Date()
            const year = yearParam ? parseInt(yearParam) : now.getFullYear()
            const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

            if (granularity === 'day') {
                startDate = new Date(year, month - 1, 1) // Start of current month
                endDate = new Date(year, month, 0, 23, 59, 59) // End of current month
            } else if (granularity === 'month') {
                startDate = new Date(year, 0, 1) // Start of current year
                endDate = new Date(year, 11, 31, 23, 59, 59) // End of current year
            } else { // year
                startDate = new Date(year - 4, 0, 1) // 5 years ago
                endDate = new Date(year, 11, 31, 23, 59, 59) // End of current year
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

        // 1. Fetch Orders for calculations
        // 1. Fetch Orders for calculations
        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                orderItems: {
                    include: { menuItem: true }
                },
                payment: {
                    include: { method: true }
                }
            }
        })

        // Fix: Only count COMPLETED orders for all stats (Revenue, Count, Charts)
        // Fix: Count [CONFIRMED, PREPARING, READY, COMPLETED] orders for all stats (Revenue, Count, Charts)
        // so daily/monthly metrics aren't empty when there are active orders
        const validStatuses = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']
        const validOrders = orders.filter(o => validStatuses.includes(o.status))
        const cancelledOrders = orders.filter(o => o.status === 'CANCELLED')

        // 2. Aggregate Stats
        const stats = {
            totalOrders: validOrders.length, // Only COMPLETED
            totalRevenue: validOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0),
            cancelledOrders: cancelledOrders.length,
            cancelledRevenue: cancelledOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0),
            totalMenuItems: await prisma.menuItem.count({ where: { restaurantId, deletedAt: null } }),
            totalCategories: await prisma.category.count({ where: { restaurantId, deletedAt: null } })
        }

        // Aggregate Top Menu Items
        const itemMap = new Map<string, { name: string, count: number, revenue: number }>()
        validOrders.forEach(o => {
            o.orderItems.forEach(item => {
                if (item.menuItem) {
                    const existing = itemMap.get(item.menuItemId) || { name: item.menuItem.name, count: 0, revenue: 0 }
                    existing.count += item.quantity
                    existing.revenue += (item.price * item.quantity)
                    itemMap.set(item.menuItemId, existing)
                } else {
                    // Handle orphaned items (soft deleted before implementation or check failure)
                    const existing = itemMap.get('unknown-' + item.menuItemId) || { name: 'Deleted Item', count: 0, revenue: 0 }
                    existing.count += item.quantity
                    existing.revenue += (item.price * item.quantity)
                    itemMap.set('unknown-' + item.menuItemId, existing)
                }
            })
        })
        const topMenuItems = Array.from(itemMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        // Aggregate Top Payment Methods
        const paymentMap = new Map<string, { name: string, count: number, revenue: number }>()

        validOrders.forEach(o => {
            const methodType = o.payment?.method?.type || 'CASH'
            // Use existing entry or create new
            const existing = paymentMap.get(methodType) || { name: methodType, count: 0, revenue: 0 }

            existing.count += 1
            existing.revenue += (o.totalAmount || 0)

            paymentMap.set(methodType, existing)
        })

        const topPaymentMethods = Array.from(paymentMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        // 3. Generate Daily Data for Chart
        // 3. Generate Daily Data for Chart
        const chartData: Record<string, { count: number, revenue: number }> = {}

        // Helper to format date key
        const getKey = (date: Date, type: string) => {
            if (type === 'year') return date.getFullYear().toString()
            if (type === 'month') return date.toISOString().slice(0, 7) // YYYY-MM
            return date.toISOString().split('T')[0] // YYYY-MM-DD
        }

        // Initialize range (optional for day, harder for dynamic month/year, relying on sparse data fill is okay or we pre-fill)
        // For simplicity and robustness, we'll iterate validOrders only, but frontend charts usually prefer continuous info.
        // Let's pre-fill based on range if feasible, or just return what we have.
        // Pre-filling 'day' is already done. Let's keep it for 'day'. 
        // For 'month', we iterate months.

        if (granularity === 'day') {
            const loopDate = new Date(startDate);
            while (loopDate <= endDate) {
                const dateKey = loopDate.toISOString().split('T')[0];
                chartData[dateKey] = { count: 0, revenue: 0 };
                loopDate.setDate(loopDate.getDate() + 1);
            }
        } else if (granularity === 'month') {
            const loopDate = new Date(startDate);
            // set to first day of month to be safe
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

        validOrders.forEach(o => {
            const d = new Date(o.createdAt)
            const dateKey = getKey(d, granularity)

            if (!chartData[dateKey]) {
                // Initialize if not exists (e.g. range mismatch slightly or safety)
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
        })

    } catch (error) {
        console.error('Report Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 })
    }
}
