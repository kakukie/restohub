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
        if (!prisma.subscriptionPlan) {
            return NextResponse.json({ success: false, error: 'System Error: Database model missing.' }, { status: 500 })
        }
        const body = await request.json()

        const plan = await prisma.subscriptionPlan.create({
            data: {
                ...body,
                features: body.features || []
            }
        })

        return NextResponse.json({ success: true, data: plan })
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create plan' }, { status: 500 })
    }
}

// PUT /api/subscription-plans - Update or Upsert
export async function PUT(request: NextRequest) {
    try {
        if (!prisma.subscriptionPlan) {
            return NextResponse.json({ success: false, error: 'System Error: Database model missing.' }, { status: 500 })
        }
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

        // Use upsert to handle cases where the record might be missing (P2025)
        const plan = await prisma.subscriptionPlan.upsert({
            where: { id },
            update: {
                ...updates,
                features: updates.features || []
            },
            create: {
                id,
                name: updates.name || 'Unnamed Plan',
                description: updates.description || '',
                price: typeof updates.price === 'number' ? updates.price : parseFloat(updates.price || '0'),
                menuLimit: typeof updates.menuLimit === 'number' ? updates.menuLimit : parseInt(updates.menuLimit || '0'),
                features: updates.features || [],
                isActive: updates.isActive ?? true
            }
        })

        return NextResponse.json({
            success: true,
            data: plan
        })

    } catch (error) {
        console.error('Update Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to update plan' }, { status: 500 })
    }
}
