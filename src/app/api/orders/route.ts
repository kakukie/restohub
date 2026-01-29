import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurantId')
    const customerId = searchParams.get('customerId') // For customer history if needed

    const where: any = {}
    if (restaurantId) where.restaurantId = restaurantId
    if (customerId) where.customerId = customerId

    // Simple date filtering can be added here if needed, or handled by client for now.

    const orders = await prisma.order.findMany({
      where,
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
        name: i.menuItem.name,
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
    const { restaurantId, items, totalAmount, tableNumber, notes, customerName, customerId } = body
    // items: { menuItemId, quantity, price, notes }[]

    // Use transaction
    const order = await prisma.$transaction(async (tx) => {
      // If no customerId, create a temporary/guest user? 
      // Our schema requires customerId. 
      // If the user is GUEST, we might need a dedicated Guest User or create one on the fly.
      // For now, let's assume the frontend passes a valid ID or we use a "Guest" account concept.
      // Or schema change to make customerId optional?

      // Let's check Schema: `customerId String` (Required). `User` model.
      // So we MUST have a user. 
      // If guest, we create a phantom user?

      let finalCustomerId = customerId
      if (!finalCustomerId) {
        // Try to find or create a guest user for this session?
        // Or require login.
        // For now, let's assume we create a Guest User if not provided (simple fallback)
        const guest = await tx.user.create({
          data: {
            email: `guest-${Date.now()}-${uuidv4()}@temp.com`,
            name: customerName || 'Guest',
            role: 'CUSTOMER'
          }
        })
        finalCustomerId = guest.id
      }

      const newOrder = await tx.order.create({
        data: {
          restaurantId,
          customerId: finalCustomerId,
          totalAmount,
          tableNumber,
          notes,
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          orderItems: {
            create: items.map((item: any) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes
            }))
          }
        },
        include: { orderItems: true }
      })

      return newOrder
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })

  } catch (error) {
    console.error("Order Creation Error", error)
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 })
  }
}
