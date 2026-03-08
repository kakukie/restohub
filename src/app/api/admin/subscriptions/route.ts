import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {

        const subscriptions = await prisma.subscriptionPayment.findMany({
            include: {
                restaurant: {
                    select: {
                        name: true,
                        email: true,
                        package: true,
                        status: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ success: true, data: subscriptions })
    } catch (error: any) {
        console.error('Failed to get subscriptions:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve subscriptions' },
            { status: 500 }
        )
    }
}
