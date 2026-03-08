import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJwt } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

// POST /api/subscription-payment — Create payment record
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { restaurantId, planName, amount, method, proofImageUrl, notes } = body

        if (!restaurantId || !planName || !amount) {
            return NextResponse.json(
                { success: false, error: 'restaurantId, planName, dan amount wajib diisi' },
                { status: 400 }
            )
        }

        // Cast prisma as any until after migration generates the client type
        const db = prisma as any

        const restaurantExists = await db.restaurant.findUnique({ where: { id: restaurantId } })
        if (!restaurantExists) {
            return NextResponse.json({ success: false, error: 'Restoran tidak ditemukan' }, { status: 404 })
        }

        // Check for existing pending payment
        const existing = await db.subscriptionPayment.findFirst({
            where: { restaurantId, status: 'PENDING' }
        })
        if (existing) {
            const updated = await db.subscriptionPayment.update({
                where: { id: existing.id },
                data: {
                    planName,
                    amount: parseFloat(amount),
                    method: method || 'BANK_TRANSFER',
                    proofImageUrl: proofImageUrl || null,
                    notes: notes || null,
                    updatedAt: new Date()
                }
            })
            return NextResponse.json({ success: true, data: updated })
        }

        const payment = await db.subscriptionPayment.create({
            data: {
                restaurantId,
                planName,
                amount: parseFloat(amount),
                method: method || 'BANK_TRANSFER',
                status: 'PENDING',
                proofImageUrl: proofImageUrl || null,
                notes: notes || null,
            }
        })

        return NextResponse.json({ success: true, data: payment }, { status: 201 })
    } catch (error: any) {
        console.error('Create subscription payment error:', error)
        return NextResponse.json({ success: false, error: 'Gagal membuat pembayaran' }, { status: 500 })
    }
}

// GET /api/subscription-payment?restaurantId=xxx
export async function GET(request: NextRequest) {
    try {
        const db = prisma as any
        const { searchParams } = new URL(request.url)
        const restaurantId = searchParams.get('restaurantId')

        if (!restaurantId) {
            // Super admin: get all payments
            const adminToken = request.cookies.get('adminToken')?.value
            if (!adminToken) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
            }
            const decoded = await verifyJwt(adminToken)
            if (!decoded || decoded.role !== 'SUPER_ADMIN') {
                return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
            }

            const payments = await db.subscriptionPayment.findMany({
                include: {
                    restaurant: {
                        select: { id: true, name: true, email: true, admin: { select: { name: true, email: true } } }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json({ success: true, data: payments })
        }

        const payment = await db.subscriptionPayment.findFirst({
            where: { restaurantId },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ success: true, data: payment })
    } catch (error: any) {
        console.error('Get subscription payment error:', error)
        return NextResponse.json({ success: false, error: 'Gagal mengambil data pembayaran' }, { status: 500 })
    }
}
