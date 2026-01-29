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

        const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()
        const month = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1

        // Date Range for the selected month
        const startDate = new Date(year, month - 1, 1) // 1st day of month
        const endDate = new Date(year, month, 0, 23, 59, 59) // Last day of month

        // 1. Fetch Orders for calculations
        const orders = await prisma.order.findMany({
            where: {
                restaurantId,
                createdAt: { gte: startDate, lte: endDate }
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

        // 3. Generate Daily Data for Chart
        const dailyData: Record<string, { count: number, revenue: number }> = {}
        const daysInMonth = endDate.getDate()

        // Init all days with 0
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month - 1, i)
            // Format YYYY-MM-DD local
            // A simple way to match the client-side key generation:
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            dailyData[dateKey] = { count: 0, revenue: 0 }
        }

        validOrders.forEach(o => {
            const d = new Date(o.createdAt)
            const dateKey = d.toISOString().split('T')[0] // UTC date part, might need timezone adjustment?
            // Reuse the logic from client:
            // Client used: const dateKey = d.toISOString().split('T')[0];
            // But client was looping days.
            // Let's rely on simple string matching for now or robust day extraction.

            // Better: extract YYYY-MM-DD from the Date object respecting timezone if possible, 
            // but Node runs in UTC usually.
            // Let's stick to ISO split for consistent UTC handling
            if (dailyData[dateKey]) {
                dailyData[dateKey].count++
                dailyData[dateKey].revenue += (o.totalAmount || 0)
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                stats,
                dailyData
            }
        })

    } catch (error) {
        console.error('Report Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 })
    }
}
