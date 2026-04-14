import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId') // For customer history if needed
    const paymentMethodParam = searchParams.get('paymentMethod') // NEW: filter by payment method
    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const where: any = {}
    
    // Safety: Always filter by the user's restaurantId if not Super Admin
    if (user.role !== 'SUPER_ADMIN') {
      where.restaurantId = user.restaurantId
    } else {
      // Super Admin can filter by any restaurantId
      const targetRid = searchParams.get('restaurantId')
      if (targetRid) where.restaurantId = targetRid
    }

    if (customerId) where.customerId = customerId

    // Date Filtering
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam)
      const end = new Date(endDateParam)
      // Ensure end date covers the full day
      end.setHours(23, 59, 59, 999)

      where.createdAt = {
        gte: start,
        lte: end
      }
    }

    // Payment Method Filtering (uses direct 'type' field stored on Payment record)
    if (paymentMethodParam && paymentMethodParam !== 'ALL') {
      where.payment = {
        type: paymentMethodParam
      }
    }

    const orders = await prisma.order.findMany({
      where,
      take: (startDateParam && endDateParam) ? undefined : 150, // Prevent massive payloads on live queue
      include: {
        orderItems: {
          include: { menuItem: true }
        },
        payment: {
          include: { method: true }
        },
        customer: {
          select: { name: true, phone: true } // Minimal user info
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform to match frontend expected shape if needed, BUT frontend likely expects what Prisma returns mostly.
    // The frontend expects: `items` (from orderItems), `totalAmount`, `status`, `customerName`, `paymentMethod`.
    // We might need to map it.

    const formattedOrders = orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.name || 'Guest',
      tableNumber: o.tableNumber,
      items: o.orderItems.map(i => ({
        id: i.id,
        menuItemId: i.menuItemId,
        menuItemName: i.menuItem.name,
        quantity: i.quantity,
        price: i.price,
        notes: i.notes
      })),
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.payment?.method?.type || 'CASH', // Flatten payment method
      createdAt: o.createdAt.toISOString()
    }))

    return NextResponse.json({ success: true, data: formattedOrders })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// POST /api/orders - Create Order (Public/User)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, items, totalAmount, tableNumber, notes, customerName, customerId, paymentMethod } = body
    // items: { menuItemId, quantity, price, notes }[]

    // Security Fix: Do not trust frontend pricing. Fetch menu items from DB.
    const menuItemIds = items.map((i: any) => i.menuItemId)
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurantId,
        isActive: true,
        isAvailable: true,
        deletedAt: null
      }
    })

    if (dbMenuItems.length !== menuItemIds.length) {
      return NextResponse.json({ success: false, error: 'Beberapa menu tidak tersedia atau sudah dihapus.' }, { status: 400 })
    }

    let calculatedTotalAmount = 0
    const validatedItems = items.map((item: any) => {
      const dbItem = dbMenuItems.find(i => i.id === item.menuItemId)
      if (!dbItem) throw new Error('Menu item not found')
      
      const itemPrice = dbItem.price
      calculatedTotalAmount += (itemPrice * item.quantity)
      
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: itemPrice, // USE SECURE DB PRICE!
        notes: item.notes
      }
    })

    // Use transaction
    const order = await prisma.$transaction(async (tx) => {
      let finalCustomerId = customerId
      if (!finalCustomerId) {
        const guest = await tx.user.create({
          data: {
            email: `guest-${Date.now()}-${uuidv4()}@temp.com`,
            name: customerName || 'Guest',
            role: 'CUSTOMER'
          }
        })
        finalCustomerId = guest.id
      }

      let paymentCreateData: any = undefined
      if (paymentMethod) {
        const pm = await tx.paymentMethod.findFirst({
          where: { restaurantId, type: paymentMethod, isActive: true }
        })

        if (pm) {
          paymentCreateData = {
            create: {
              amount: calculatedTotalAmount,
              status: 'PENDING',
              type: paymentMethod,
              methodId: pm.id
            }
          }
        } else {
          console.warn(`Payment method ${paymentMethod} not found for restaurant ${restaurantId}`)
        }
      }

      const newOrder = await tx.order.create({
        data: {
          restaurantId,
          customerId: finalCustomerId,
          totalAmount: calculatedTotalAmount, // USE CALCULATED AMOUNT
          tableNumber,
          notes,
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          payment: paymentCreateData,
          orderItems: {
            create: validatedItems
          }
        },
        include: { orderItems: true, payment: { include: { method: true } } }
      })

      return newOrder
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })

  } catch (error) {
    console.error("Order Creation Error", error)
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 })
  }
}
// PUT /api/orders - Update Order Status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, paymentStatus } = body

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 })
    }

    // 1. Fetch Order and Check Ownership
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const auth = authorizeAction(user, existingOrder.restaurantId, 'PUT')
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    const updates: any = {}
    if (status) {
      updates.status = status
      // If confirming order, assume payment is collected (unless manual payment flow overrides)
      // This ensures reports show correct Revenue.
      if (status === 'CONFIRMED' && !paymentStatus) {
        updates.paymentStatus = 'PAID'
      }
    }
    if (paymentStatus) updates.paymentStatus = paymentStatus

    // Log manual notifications if provided (Simulated Sending)
    const { manualEmail, manualPhone } = body
    if (status === 'CONFIRMED' && (manualEmail || manualPhone)) {
      console.log(`[NOTIFY] Manual Notification Triggered for Order ${orderId}`)
      if (manualEmail) console.log(`[NOTIFY] Sending Email to: ${manualEmail}`)
      if (manualPhone) console.log(`[NOTIFY] Sending WhatsApp to: ${manualPhone}`)
      // TODO: Integrate actual mailer/whatsapp gateway here
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updates
    })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("Update Order Error", error)
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
  }
}
