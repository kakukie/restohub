import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { items, reason } = body // items: [{ orderItemId, quantity, disposition: 'GOOD' | 'DAMAGED' }]

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items to return' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, orderItems: true, customer: true }
    })

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })

    const auth = authorizeAction(user, order.restaurantId, 'POST')
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Return record
      const returnCount = await tx.return.count({ where: { restaurantId: order.restaurantId } })
      const returnNumber = `RET/${new Date().getFullYear()}/${(returnCount + 1).toString().padStart(4, '0')}`
      
      let totalRefund = 0
      const returnItemsData = []

      for (const item of items) {
        const orderItem = order.orderItems.find(oi => oi.id === item.orderItemId)
        if (!orderItem) throw new Error(`Item ${item.orderItemId} not found in order`)
        
        if (item.quantity > orderItem.quantity) {
          throw new Error(`Return quantity for ${orderItem.id} exceeds ordered quantity`)
        }

        totalRefund += (orderItem.price * item.quantity)
        
        returnItemsData.push({
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          price: orderItem.price,
          disposition: item.disposition,
          notes: reason
        })

        // 2. Update Stock if disposition is GOOD
        if (item.disposition === 'GOOD') {
          const menuItem = await tx.menuItem.findUnique({ where: { id: orderItem.menuItemId } })
          if (menuItem?.isStockManaged) {
            await tx.menuItem.update({
              where: { id: orderItem.menuItemId },
              data: { stock: { increment: item.quantity } }
            })

            await tx.stockMovement.create({
              data: {
                menuItemId: orderItem.menuItemId,
                restaurantId: order.restaurantId,
                type: 'RETURN_GOOD',
                quantity: item.quantity,
                previousStock: menuItem.stock,
                newStock: menuItem.stock + item.quantity,
                reason: `Retur Order ${order.orderNumber}`
              }
            })
          }
        } else {
            // Log as waste if damaged
            const menuItem = await tx.menuItem.findUnique({ where: { id: orderItem.menuItemId } })
            if (menuItem?.isStockManaged) {
                await tx.stockMovement.create({
                    data: {
                        menuItemId: orderItem.menuItemId,
                        restaurantId: order.restaurantId,
                        type: 'RETURN_DAMAGED',
                        quantity: item.quantity,
                        previousStock: menuItem.stock,
                        newStock: menuItem.stock, // Stock doesn't change because it's damaged
                        reason: `Retur (Rusak) Order ${order.orderNumber}`
                    }
                })
            }
        }
      }

      const returnRecord = await tx.return.create({
        data: {
          orderId,
          restaurantId: order.restaurantId,
          returnNumber,
          reason,
          totalRefund,
          status: 'COMPLETED',
          returnItems: {
            create: returnItemsData
          }
        },
        include: { returnItems: true }
      })

      return returnRecord
    })

    // WhatsApp Notification
    const token = process.env.FONNTE_TOKEN
    if (token && order.customer?.phone) {
      const message = `Halo ${order.customer.name},\n\nRetur pesanan Anda ${order.orderNumber} telah diproses dengan nomor retur ${result.returnNumber}. Total pengembalian: Rp ${result.totalRefund.toLocaleString('id-ID')}.\n\nTerima kasih.`
      
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: token },
        body: new URLSearchParams({
          target: order.customer.phone,
          message: message
        })
      })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("Process Return Error", error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to process return' }, { status: 500 })
  }
}
