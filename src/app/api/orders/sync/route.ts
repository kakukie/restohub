import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

function sanitizeString(str: unknown, maxLen = 500): string {
  if (typeof str !== 'string') return ''
  return str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLen)
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${ts}-${rand}`
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { orders } = body

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada order untuk disinkronisasi.' }, { status: 400 })
    }

    const restaurantId = user.restaurantId
    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'Restaurant ID tidak ditemukan.' }, { status: 400 })
    }

    const auth = authorizeAction(user, restaurantId, 'POST')
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { taxRate: true, discountRate: true }
    })

    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant tidak ditemukan.' }, { status: 404 })
    }

    const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
    }

    for (const orderPayload of orders) {
        try {
            const { items, tableNumber, notes, customerName, paymentMethod, orderSource, adminNotes, createdAt } = orderPayload
            
            const menuItemIds = items.map((i: any) => i.menuItemId)
            const dbMenuItems = await prisma.menuItem.findMany({
                where: { id: { in: menuItemIds }, restaurantId: restaurantId, isAvailable: true, deletedAt: null }
            })

            let calculatedSubtotal = 0
            let totalTax = 0
            const validatedItems = items.map((item: any) => {
                const dbItem = dbMenuItems.find(i => i.id === item.menuItemId)
                if (!dbItem) throw new Error('Menu item not found')
                
                if (dbItem.isStockManaged && dbItem.stock < item.quantity) {
                    throw new Error(`Stok menu ${dbItem.name} tidak mencukupi.`)
                }
                
                const itemPrice = dbItem.price
                const itemTax = (itemPrice * item.quantity * (dbItem.taxRate || 0)) / 100
                calculatedSubtotal += (itemPrice * item.quantity)
                totalTax += itemTax
                
                return {
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: itemPrice,
                    notes: sanitizeString(item.notes, 200)
                }
            })

            const taxAmount = totalTax
            const discountAmount = 0 
            const calculatedTotalAmount = calculatedSubtotal + taxAmount - discountAmount

            let attempts = 0
            const MAX_ATTEMPTS = 3
            let orderCreated = false

            while (attempts < MAX_ATTEMPTS && !orderCreated) {
                attempts++
                try {
                    await prisma.$transaction(async (tx) => {
                        const guest = await tx.user.create({
                            data: { email: `guest-${Date.now()}-${uuidv4()}@temp.com`, name: sanitizeString(customerName, 100) || 'Guest', role: 'CUSTOMER' }
                        })

                        let paymentCreateData: any = undefined
                        if (paymentMethod) {
                            const pm = await tx.paymentMethod.findFirst({ where: { restaurantId, type: paymentMethod, isActive: true } })
                            if (pm) {
                                paymentCreateData = {
                                    create: { amount: calculatedTotalAmount, status: 'PAID', type: paymentMethod, methodId: pm.id }
                                }
                            }
                        }

                        await tx.order.create({
                            data: {
                                restaurantId,
                                customerId: guest.id,
                                totalAmount: calculatedTotalAmount,
                                tableNumber: sanitizeString(tableNumber, 20),
                                notes: sanitizeString(notes, 500),
                                orderNumber: generateOrderNumber(),
                                status: 'COMPLETED',
                                paymentStatus: 'PAID',
                                orderSource: orderSource || 'POS',
                                adminNotes: sanitizeString(adminNotes, 1000) || null,
                                taxAmount,
                                discountAmount,
                                payment: paymentCreateData,
                                orderItems: { create: validatedItems },
                                createdAt: createdAt ? new Date(createdAt) : undefined
                            }
                        })

                        // Reduce stock
                        for (const item of validatedItems) {
                            const dbItem = dbMenuItems.find(i => i.id === item.menuItemId)
                            if (dbItem?.isStockManaged) {
                                await tx.menuItem.update({
                                    where: { id: item.menuItemId },
                                    data: { stock: { decrement: item.quantity } }
                                })
                            }
                        }
                    })
                    orderCreated = true
                    results.success++
                } catch (txError: any) {
                    if (txError?.code === 'P2002' && attempts < MAX_ATTEMPTS) {
                        continue
                    }
                    throw txError
                }
            }
            if (!orderCreated) throw new Error('Retries exhausted')
        } catch (err: any) {
            results.failed++
            results.errors.push(err.message)
        }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Sync Orders Error", error)
    return NextResponse.json({ success: false, error: 'Gagal sinkronisasi order.' }, { status: 500 })
  }
}
