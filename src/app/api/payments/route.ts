import { NextRequest, NextResponse } from 'next/server'

// GET /api/payments - Get payment methods
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurantId')

    // Mock payment methods for demo
    const paymentMethods = [
      {
        id: '1',
        type: 'QRIS',
        isActive: true,
        merchantId: 'ID1234567890'
      },
      {
        id: '2',
        type: 'GOPAY',
        isActive: true
      },
      {
        id: '3',
        type: 'OVO',
        isActive: true
      },
      {
        id: '4',
        type: 'DANA',
        isActive: true
      },
      {
        id: '5',
        type: 'LINKAJA',
        isActive: false
      },
      {
        id: '6',
        type: 'SHOPEEPAY',
        isActive: true
      }
    ]

    return NextResponse.json({
      success: true,
      data: paymentMethods
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch payment methods'
    }, { status: 500 })
  }
}

// POST /api/payments/process - Process a payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentMethodId, amount, type } = body

    if (!orderId || !paymentMethodId || !amount || !type) {
      return NextResponse.json({
        success: false,
        error: 'Order ID, payment method ID, amount, and type are required'
      }, { status: 400 })
    }

    // Mock payment processing
    const payment = {
      id: crypto.randomUUID(),
      orderId,
      paymentMethodId,
      amount,
      type,
      status: 'PAID',
      transactionId: `TXN-${Date.now()}`,
      paymentDate: new Date().toISOString(),
      receiptData: JSON.stringify({
        method: type,
        amount,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      data: payment
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process payment'
    }, { status: 500 })
  }
}
