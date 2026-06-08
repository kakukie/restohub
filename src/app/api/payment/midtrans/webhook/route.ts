import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyMidtransSignature } from '@/lib/midtrans'
import { sendPaymentSuccessEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            order_id,
            status_code,
            gross_amount,
            signature_key,
            transaction_status,
            payment_type,
            va_numbers,
            settlement_time,
            expiry_time
        } = body

        if (!order_id || !status_code || !gross_amount || !signature_key) {
            return NextResponse.json({ success: false, error: 'Payload tidak lengkap' }, { status: 400 })
        }

        const valid = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)
        if (!valid) {
            return NextResponse.json({ success: false, error: 'Signature tidak valid' }, { status: 403 })
        }

        const db = prisma as any
        const payment = await db.subscriptionPayment.findFirst({
            where: { orderId: order_id },
            include: {
                restaurant: {
                    include: {
                        admin: { select: { name: true, email: true } }
                    }
                }
            }
        })
        if (!payment) {
            return NextResponse.json({ success: false, error: 'Payment tidak ditemukan' }, { status: 404 })
        }

        const isSuccess = ['settlement', 'capture', 'success'].includes(transaction_status)
        const isFailed = ['cancel', 'deny', 'expire', 'failure'].includes(transaction_status)
        const previousStatus = payment.status
        const cycleMonths = payment.cycleMonths || 1
        const baseDate = payment.restaurant?.activeUntil && new Date(payment.restaurant.activeUntil) > new Date()
            ? new Date(payment.restaurant.activeUntil)
            : new Date()
        const nextActiveUntil = new Date(baseDate)
        nextActiveUntil.setMonth(nextActiveUntil.getMonth() + cycleMonths)

        const updated = await db.subscriptionPayment.update({
            where: { id: payment.id },
            data: {
                midtransStatus: transaction_status,
                paymentType: payment_type,
                paymentChannel: va_numbers?.[0]?.bank || payment_type,
                status: isSuccess ? 'PAID' : isFailed ? 'REJECTED' : 'PENDING',
                paidAt: isSuccess ? new Date(settlement_time || Date.now()) : null,
                expiredAt: expiry_time ? new Date(expiry_time) : payment.expiredAt,
                validatedAt: isSuccess ? new Date() : payment.validatedAt,
                updatedAt: new Date()
            }
        })

        if (isSuccess) {
            await db.restaurant.update({
                where: { id: payment.restaurantId },
                data: {
                    status: 'ACTIVE',
                    isActive: true,
                    package: payment.planName,
                    activeUntil: nextActiveUntil,
                }
            })

            if (previousStatus !== 'PAID') {
                const ownerEmail = payment.restaurant?.admin?.email || payment.restaurant?.email
                const ownerName = payment.restaurant?.admin?.name || payment.restaurant?.name || 'Pemilik'
                if (ownerEmail) {
                    await sendPaymentSuccessEmail(
                        ownerEmail,
                        ownerName,
                        payment.restaurant?.name || 'Restoran',
                        payment.planName,
                        payment.amount,
                        ownerEmail
                    )
                }
            }
        }

        return NextResponse.json({ success: true, data: updated })
    } catch (error: any) {
        console.error('Midtrans webhook error', error)
        return NextResponse.json({ success: false, error: 'Gagal memproses webhook' }, { status: 500 })
    }
}
