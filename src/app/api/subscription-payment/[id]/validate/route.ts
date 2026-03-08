import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJwt } from '@/lib/jwt'
import { sendPaymentSuccessEmail } from '@/lib/mail'

// POST /api/subscription-payment/[id]/validate
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = prisma as any

        // Verify Super Admin token
        const adminToken = request.cookies.get('adminToken')?.value
        if (!adminToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const decoded = await verifyJwt(adminToken)
        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { action, notes } = body // action: 'APPROVE' | 'REJECT'

        const payment = await db.subscriptionPayment.findUnique({
            where: { id: params.id },
            include: {
                restaurant: {
                    include: { admin: { select: { name: true, email: true } } }
                }
            }
        })

        if (!payment) {
            return NextResponse.json({ success: false, error: 'Payment tidak ditemukan' }, { status: 404 })
        }
        if (payment.status !== 'PENDING') {
            return NextResponse.json({ success: false, error: 'Payment sudah diproses' }, { status: 400 })
        }

        if (action === 'APPROVE') {
            await db.subscriptionPayment.update({
                where: { id: params.id },
                data: {
                    status: 'PAID',
                    validatedAt: new Date(),
                    validatedBy: (decoded as any).userId || (decoded as any).id,
                    notes: notes || null
                }
            })

            // Activate restaurant
            await db.restaurant.update({
                where: { id: payment.restaurantId },
                data: {
                    status: 'ACTIVE',
                    isActive: true,
                    package: payment.planName,
                }
            })

            // Send email
            const ownerEmail = payment.restaurant?.admin?.email
            const ownerName = payment.restaurant?.admin?.name || 'Pemilik'
            if (ownerEmail) {
                await sendPaymentSuccessEmail(
                    ownerEmail,
                    ownerName,
                    payment.restaurant.name,
                    payment.planName,
                    payment.amount
                )
            }

            return NextResponse.json({
                success: true,
                message: 'Pembayaran disetujui, restoran diaktifkan, email terkirim.'
            })
        } else if (action === 'REJECT') {
            await db.subscriptionPayment.update({
                where: { id: params.id },
                data: {
                    status: 'REJECTED',
                    validatedAt: new Date(),
                    validatedBy: (decoded as any).userId || (decoded as any).id,
                    notes: notes || 'Ditolak oleh admin'
                }
            })

            return NextResponse.json({ success: true, message: 'Pembayaran ditolak.' })
        } else {
            return NextResponse.json({ success: false, error: 'Action tidak valid (APPROVE | REJECT)' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('Validate payment error:', error)
        return NextResponse.json({ success: false, error: 'Gagal memproses pembayaran' }, { status: 500 })
    }
}
