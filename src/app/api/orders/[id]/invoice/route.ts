import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const orderId = params.id
    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        payment: { include: { method: true } },
        customer: true
      }
    })

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })

    const auth = authorizeAction(user, order.restaurantId, 'GET')
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    // Check if feature is enabled
    if (!order.restaurant.enabledFeatures.includes('CUSTOM_INVOICE')) {
      return NextResponse.json({ success: false, error: 'Fitur Invoice Profesional tidak aktif untuk restoran ini.' }, { status: 403 })
    }

    // Generate Invoice Number if not exists
    if (!order.invoiceNumber) {
      const year = new Date().getFullYear()
      const startOfYear = new Date(year, 0, 1)
      const prefix = (order.restaurant.invoiceSettings as any)?.prefix || 'INV'
      
      // Find latest invoice this year for this restaurant
      const lastOrder = await prisma.order.findFirst({
        where: {
          restaurantId: order.restaurantId,
          invoiceDate: { gte: startOfYear },
          invoiceNumber: { startsWith: `${prefix}/${year}/` }
        },
        orderBy: { invoiceNumber: 'desc' }
      })

      let nextSeq = 1
      if (lastOrder && lastOrder.invoiceNumber) {
        const parts = lastOrder.invoiceNumber.split('/')
        const lastSeq = parseInt(parts[parts.length - 1])
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1
      }

      const invoiceNumber = `${prefix}/${year}/${nextSeq.toString().padStart(4, '0')}`
      
      await prisma.order.update({
        where: { id: orderId },
        data: {
          invoiceNumber,
          invoiceDate: new Date()
        }
      })
      
      order.invoiceNumber = invoiceNumber
      order.invoiceDate = new Date()
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("Fetch Invoice Error", error)
    return NextResponse.json({ success: false, error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const orderId = params.id
    const body = await request.json()
    const { sendWhatsApp } = body

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, customer: true }
    })

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })

    const targetPhone = body.customerPhone || order.customer?.phone
    
    if (sendWhatsApp) {
      if (!targetPhone) {
        return NextResponse.json({ success: false, error: 'Missing phone number' }, { status: 400 })
      }

      // Integration with WhatsApp Gateway (Fonnte)
      const token = process.env.FONNTE_TOKEN
      if (token) {
        const message = `Halo ${order.customer?.name || 'Customer'},\n\nTerima kasih telah berkunjung ke ${order.restaurant.name}. Berikut adalah link invoice digital Anda: ${process.env.NEXT_PUBLIC_BASE_URL}/invoice/${order.id}\n\nSampai jumpa kembali!`
        
        const fonnteRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { Authorization: token },
          body: new URLSearchParams({
            target: targetPhone,
            message: message
          })
        })
        const fonnteData = await fonnteRes.json()
        if (!fonnteData.status) {
           return NextResponse.json({ success: false, error: fonnteData.reason || 'Gagal mengirim pesan via Fonnte' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ success: false, error: 'WhatsApp Gateway belum dikonfigurasi (Token Missing)' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'WhatsApp sent successfully' })
  } catch (error) {
    console.error("Send WA Error", error)
    return NextResponse.json({ success: false, error: 'Failed to send WhatsApp' }, { status: 500 })
  }
}
