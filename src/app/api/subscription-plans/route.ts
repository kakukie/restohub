import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/subscription-plans
export async function GET(request: NextRequest) {
    try {
        // Safety check for Prisma Client generation issues
        if (!prisma.subscriptionPlan) {
            // Log detailed error for debugging
            console.error('CRITICAL: prisma.subscriptionPlan is undefined. Client generation failed or stale.')
            return NextResponse.json({ success: false, error: 'System Error: Database model missing. Please contact support.' }, { status: 500 })
        }

        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { price: 'asc' }
        })
        return NextResponse.json({ success: true, data: plans })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch plans' }, { status: 500 })
    }
}

// POST /api/subscription-plans - Create or Init
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        // Validation ignored for brevity
        const plan = await prisma.subscriptionPlan.create({
            data: body
        })
        return NextResponse.json({ success: true, data: plan })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create plan' }, { status: 500 })
    }
}

// PUT /api/subscription-plans - Update or Seed
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: updates
        })
        return NextResponse.json({ success: true, data: plan })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false, error: 'Failed to update plan' }, { status: 500 })
    }
}
