import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSnapClient, isMidtransConfigured } from '@/lib/midtrans'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        if (!isMidtransConfigured()) {
            return NextResponse.json({ success: false, error: 'Midtrans belum dikonfigurasi di env' }, { status: 500 })
        }

        const body = await request.json()
        const { restaurantId, plan, cycle } = body || {}
        if (!restaurantId || !plan) {
            return NextResponse.json({ success: false, error: 'restaurantId dan plan wajib diisi' }, { status: 400 })
        }

        const cycleMonths = Math.max(1, parseInt(cycle || '1', 10))

        const db = prisma as any
        const restaurant = await db.restaurant.findUnique({
            where: { id: restaurantId },
            include: { admin: true }
        })
        if (!restaurant) {
            return NextResponse.json({ success: false, error: 'Restoran tidak ditemukan' }, { status: 404 })
        }

        // Ambil data paket
        const plans = await db.subscriptionPlan.findMany({ where: { isActive: true } })
        const targetPlan = plans.find((p: any) =>
            p.id === plan ||
            p.name.toUpperCase().replace(/[ -]/g, '_') === plan.toUpperCase().replace(/[ -]/g, '_') ||
            plan.toUpperCase().includes(p.name.toUpperCase())
        )
        if (!targetPlan) {
            return NextResponse.json({ success: false, error: 'Paket tidak ditemukan' }, { status: 404 })
        }

        // Hitung harga berdasarkan siklus
        let amount = targetPlan.price
        if (cycleMonths === 3) amount = targetPlan.price3Months || targetPlan.price * 3
        else if (cycleMonths === 6) amount = targetPlan.price6Months || targetPlan.price * 6
        else if (cycleMonths === 12) amount = targetPlan.price12Months || targetPlan.price * 12

        if (!amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Harga paket belum diatur' }, { status: 400 })
        }

        const orderId = `SUBS-${restaurantId}-${Date.now()}`
        const snap = getSnapClient()

        const transaction = await snap.createTransaction({
            transaction_details: {
                order_id: orderId,
                gross_amount: Math.round(amount)
            },
            item_details: [
                {
                    id: targetPlan.id,
                    name: `${targetPlan.name} ${cycleMonths} bulan`,
                    price: Math.round(amount),
                    quantity: 1
                }
            ],
            customer_details: {
                first_name: restaurant.name || 'Customer',
                email: restaurant.email || restaurant.admin?.email,
                phone: restaurant.phone || restaurant.admin?.phone
            }
        })

        const payment = await db.subscriptionPayment.create({
            data: {
                restaurantId,
                planName: `${targetPlan.name} (${cycleMonths} bulan)`,
                amount: amount,
                grossAmount: amount,
                method: 'MIDTRANS',
                status: 'PENDING',
                cycleMonths,
                orderId,
                snapToken: transaction.token,
                redirectUrl: transaction.redirect_url,
                midtransStatus: 'PENDING'
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                token: transaction.token,
                redirectUrl: transaction.redirect_url,
                paymentId: payment.id,
                orderId
            }
        })
    } catch (error: any) {
        console.error('Midtrans charge error', error)
        return NextResponse.json({ success: false, error: 'Gagal membuat transaksi Midtrans' }, { status: 500 })
    }
}
