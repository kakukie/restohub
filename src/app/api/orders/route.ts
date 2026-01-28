import { NextRequest, NextResponse } from 'next/server'

// GET /api/orders - Get orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurantId')
    const customerId = searchParams.get('customerId')

    // Mock data for demo
    const orders = [
      {
        id: '1',
        orderNumber: 'ORD-001',
        totalAmount: 78000,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        tableNumber: 'A1',
        createdAt: new Date().toISOString(),
        items: [
          {
            id: '1',
            menuItemId: '1',
            menuItemName: 'Nasi Goreng Spesial',
            price: 35000,
            quantity: 2
          },
          {
            id: '2',
            menuItemId: '4',
            menuItemName: 'Es Teh Manis',
            price: 8000,
            quantity: 2
          }
        ]
      }
    ]

    return NextResponse.json({
      success: true,
      data: orders
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch orders'
    }, { status: 500 })
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, restaurantId, items, tableNumber, notes } = body

    if (!customerId || !restaurantId || !items || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Customer, restaurant, and items are required'
      }, { status: 400 })
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

    const newOrder = {
      id: crypto.randomUUID(),
      orderNumber: `ORD-${Date.now()}`,
      totalAmount,
      customerId,
      restaurantId,
      tableNumber,
      notes,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      items,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: newOrder
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create order'
    }, { status: 500 })
  }
}
