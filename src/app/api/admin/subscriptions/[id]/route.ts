import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    context: { params: { id?: string } | Promise<{ id?: string }> }
) {
    try {

        // Await context.params if it's a Promise (Next.js 15+ convention for dynamic routes)
        const params = await context.params;
        const id = params?.id;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Subscription ID is required' }, { status: 400 })
        }

        const body = await request.json()
        const { status, planName, amount } = body

        if (status && !['PAID', 'REJECTED', 'PENDING'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
        }

        const subscription = await prisma.subscriptionPayment.findUnique({
            where: { id }
        })

        if (!subscription) {
            return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 })
        }

        // Start transaction to update subscription and optionally the restaurant
        const result = await prisma.$transaction(async (tx) => {
            const updatedSubscription = await tx.subscriptionPayment.update({
                where: { id },
                data: {
                    status: status || subscription.status,
                    planName: planName || subscription.planName,
                    amount: typeof amount === 'number' ? amount : subscription.amount,
                    validatedAt: status && status !== 'PENDING' ? new Date() : subscription.validatedAt
                }
            })

            if (status === 'PAID') {
                // Find the plan to apply limits
                // The planName on SubscriptionPayment might be something like "Bisnis (Rp 200...)" - we need to match it cleanly
                // Assuming planName stores the actual plan ID or Name like 'BUSINESS'. We might need to handle this robustly.
                const plans = await tx.subscriptionPlan.findMany()
                const targetPlan = plans.find(p =>
                    p.id === subscription.planName ||
                    p.name.toUpperCase() === subscription.planName.toUpperCase() ||
                    subscription.planName.toUpperCase().includes(p.name.toUpperCase())
                )

                let updateData: any = {
                    package: subscription.planName, // or targetPlan?.name || subscription.planName
                    isActive: true,
                    status: 'ACTIVE'
                }

                if (targetPlan) {
                    updateData = {
                        ...updateData,
                        package: targetPlan.name,
                        maxMenuItems: targetPlan.menuLimit,
                        maxCategories: targetPlan.maxCategories,
                        allowMaps: targetPlan.allowMaps,
                        enableAnalytics: targetPlan.enableAnalytics
                    }
                }

                await tx.restaurant.update({
                    where: { id: subscription.restaurantId },
                    data: updateData
                })
            }

            return updatedSubscription
        })

        return NextResponse.json({ success: true, data: result })

    } catch (error: any) {
        console.error('Failed to update subscription:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update subscription' },
            { status: 500 }
        )
    }
}
