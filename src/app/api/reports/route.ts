import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const restaurantId = searchParams.get('restaurantId')
        const yearParam = searchParams.get('year')
        const monthParam = searchParams.get('month')

        if (!restaurantId) {
            return NextResponse.json({ success: false, error: 'Restaurant ID required' }, { status: 400 })
        }

        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        let startDate: Date, endDate: Date

        if (startDateParam && endDateParam) {
            startDate = new Date(startDateParam)
            endDate = new Date(endDateParam)
            // Adjust end date to end of day
            endDate.setHours(23, 59, 59, 999)
        } else {
            const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()
            const month = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1
            startDate = new Date(year, month - 1, 1)
            endDate = new Date(year, month, 0, 23, 59, 59)
        }

        // 1. Fetch Orders for calculations
        const orders = await prisma.order.findMany({
            where: {
                restaurantId,
                createdAt: { gte: startDate, lte: endDate }
            },
            include: {
                orderItems: {
                    include: { menuItem: true }
                },
                payment: {
                    include: { method: true }
                }
            }
        })

        const validOrders = orders.filter(o => o.status !== 'CANCELLED')
        const cancelledOrders = orders.filter(o => o.status === 'CANCELLED')

        // 2. Aggregate Stats
        const stats = {
            totalOrders: orders.length,
            totalRevenue: validOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0),
            cancelledOrders: cancelledOrders.length,
            cancelledRevenue: cancelledOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0),
            totalMenuItems: await prisma.menuItem.count({ where: { restaurantId } }),
            totalCategories: await prisma.category.count({ where: { restaurantId } })
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
                }
            })
        })
        const topMenuItems = Array.from(itemMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        // Aggregate Top Payment Methods
        const paymentMap = new Map<string, number>()
        validOrders.forEach(o => {
            const method = o.payment?.method?.type || 'CASH' // Default or unknown
            paymentMap.set(method, (paymentMap.get(method) || 0) + 1)
        })
        const topPaymentMethods = Array.from(paymentMap.entries())
            .map(([method, count]) => ({ method, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        // 3. Generate Daily Data for Chart
        const dailyData: Record<string, { count: number, revenue: number }> = {}

        // Loop from startDate to endDate to initialize data
        // Use a clone to avoid modifying startDate
        const loopDate = new Date(startDate);
        while (loopDate <= endDate) {
            const dateKey = loopDate.toISOString().split('T')[0];
            dailyData[dateKey] = { count: 0, revenue: 0 };
            loopDate.setDate(loopDate.getDate() + 1);
        }

        validOrders.forEach(o => {
            const d = new Date(o.createdAt)
            const dateKey = d.toISOString().split('T')[0]

            if (dailyData[dateKey]) {
                dailyData[dateKey].count++
                dailyData[dateKey].revenue += (o.totalAmount || 0)
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                stats,
                dailyData,
                topMenuItems,
                topPaymentMethods
            }
        })

    } catch (error) {
        console.error('Report Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 })
    }
}
