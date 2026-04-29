import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

// ─── Input Validation Helpers ────────────────────────────────────────────────
function sanitizeString(str: unknown, maxLen = 500): string {
  if (typeof str !== 'string') return ''
  return str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLen)
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${ts}-${rand}`
}

const VALID_ORDER_SOURCES = ['QR_MENU', 'POS', 'GRABFOOD', 'GOFOOD', 'SHOPEEFOOD', 'OTHER']
const VALID_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
const VALID_PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']

// GET /api/orders
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const paymentMethodParam = searchParams.get('paymentMethod')
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
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        // Ensure end date covers the full day
        end.setHours(23, 59, 59, 999)
        where.createdAt = {
          gte: start,
          lte: end
        }
      }
    }

    // Payment Method Filtering
    if (paymentMethodParam && paymentMethodParam !== 'ALL') {
      where.payment = {
        type: paymentMethodParam
      }
    }

    const orders = await prisma.order.findMany({
      where,
      take: (startDateParam && endDateParam) ? undefined : 150,
      include: {
        orderItems: {
          include: { menuItem: true }
        },
        payment: {
          include: { method: true }
        },
        customer: {
          select: { name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedOrders = orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer?.name || 'Guest',
      tableNumber: o.tableNumber,
      items: o.orderItems.map(i => ({
        id: i.id,
        menuItemId: i.menuItemId,
        menuItemName: i.menuItem?.name || 'Deleted Item',
        quantity: i.quantity,
        price: i.price,
        notes: i.notes
      })),
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.payment?.method?.type || 'CASH',
      orderSource: o.orderSource,
      adminNotes: o.adminNotes,
      taxAmount: o.taxAmount,
      discountAmount: o.discountAmount,
      deliveryAddress: (o as any).deliveryAddress,
      deliveryLat: (o as any).deliveryLat,
      deliveryLng: (o as any).deliveryLng,
      shippingCost: (o as any).shippingCost,
      shippingStatus: (o as any).shippingStatus,
      createdAt: o.createdAt.toISOString()
    }))

    return NextResponse.json({ success: true, data: formattedOrders })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// POST /api/orders - Create Order (Public from QR Menu / Authenticated from POS)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      restaurantId,
      items,
      tableNumber,
      notes,
      customerName,
      customerId,
      paymentMethod,
      orderSource,
      adminNotes,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      shippingCost,
      courierCode,
      courierService
    } = body

    // ── Input Validation ─────────────────────────────────────────────────
    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json({ success: false, error: 'Restaurant ID wajib diisi.' }, { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Minimal 1 item untuk order.' }, { status: 400 })
    }

    if (items.length > 50) {
      return NextResponse.json({ success: false, error: 'Maksimal 50 item per order.' }, { status: 400 })
    }

    // Validate order source
    const resolvedSource = (orderSource && VALID_ORDER_SOURCES.includes(orderSource)) ? orderSource : 'QR_MENU'

    // If creating from POS/admin (non QR_MENU), require authentication
    if (resolvedSource !== 'QR_MENU') {
      const user = await getAuthenticatedUser(request)
      if (!user) return NextResponse.json({ success: false, error: 'Unauthorized: Login diperlukan untuk order manual.' }, { status: 401 })
      const auth = authorizeAction(user, restaurantId, 'POST')
      if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.menuItemId || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json({ success: false, error: 'Setiap item harus memiliki menuItemId dan quantity valid.' }, { status: 400 })
      }
      if (item.quantity > 100) {
        return NextResponse.json({ success: false, error: 'Quantity per item maksimal 100.' }, { status: 400 })
      }
    }

    // Security Fix: Do not trust frontend pricing. Fetch menu items from DB.
    // Also fetch restaurant settings for Tax & Discount
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { taxRate: true, discountRate: true }
    })
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'Restaurant tidak ditemukan.' }, { status: 404 })
    }

    const menuItemIds = items.map((i: any) => i.menuItemId)
    const dbMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurantId,
        isAvailable: true,
        deletedAt: null
      }
    })

    if (dbMenuItems.length !== menuItemIds.length) {
      return NextResponse.json({ success: false, error: 'Beberapa menu tidak tersedia atau sudah dihapus.' }, { status: 400 })
    }

    let calculatedSubtotal = 0
    let totalTax = 0
    const validatedItems = items.map((item: any) => {
      const dbItem = dbMenuItems.find(i => i.id === item.menuItemId)
      if (!dbItem) throw new Error('Menu item not found')
      
      if (dbItem.isStockManaged && dbItem.stock < item.quantity) {
        throw new Error(`Stok menu ${dbItem.name} tidak mencukupi. Tersisa: ${dbItem.stock}`)
      }
      
      const itemPrice = dbItem.price
      const itemTax = (itemPrice * item.quantity * (dbItem.taxRate || 0)) / 100
      calculatedSubtotal += (itemPrice * item.quantity)
      totalTax += itemTax
      
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: itemPrice, // USE SECURE DB PRICE!
        notes: sanitizeString(item.notes, 200)
      }
    })

    const taxAmount = totalTax
    const discountAmount = 0 // Global discount removed as per user request
    const calculatedTotalAmount = calculatedSubtotal + taxAmount - discountAmount + (shippingCost || 0)

    // Sanitize text inputs
    const sanitizedNotes = sanitizeString(notes, 500)
    const sanitizedAdminNotes = sanitizeString(adminNotes, 1000)
    const sanitizedCustomerName = sanitizeString(customerName, 100) || 'Guest'
    const sanitizedTableNumber = sanitizeString(tableNumber, 20)

    // Retry loop for orderNumber collision (P2002 unique constraint)
    let attempts = 0
    const MAX_ATTEMPTS = 3

    while (attempts < MAX_ATTEMPTS) {
      attempts++
      try {
        const order = await prisma.$transaction(async (tx) => {
          let finalCustomerId = customerId
          if (!finalCustomerId) {
            const guest = await tx.user.create({
              data: {
                email: `guest-${Date.now()}-${uuidv4()}@temp.com`,
                name: sanitizedCustomerName,
                phone: body.customerPhone || null,
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
              totalAmount: calculatedTotalAmount,
              tableNumber: sanitizedTableNumber,
              notes: sanitizedNotes,
              orderNumber: generateOrderNumber(),
              status: 'PENDING',
              paymentStatus: 'PENDING',
              orderSource: resolvedSource as any,
              adminNotes: sanitizedAdminNotes || null,
              taxAmount,
              discountAmount,
              deliveryAddress,
              deliveryLat,
              deliveryLng,
              shippingCost,
              courierCode,
              courierService,
              shippingStatus: deliveryAddress ? 'PENDING' : null,
              payment: paymentCreateData,
              orderItems: {
                create: validatedItems
              }
            },
            include: { orderItems: true, payment: { include: { method: true } } }
          })

          // Reduce stock for managed items
          for (const item of validatedItems) {
            const dbItem = dbMenuItems.find(i => i.id === item.menuItemId)
            if (dbItem?.isStockManaged) {
              await tx.menuItem.update({
                where: { id: item.menuItemId },
                data: { stock: { decrement: item.quantity } }
              })
            }
          }

          return newOrder
        })

        return NextResponse.json({ success: true, data: order }, { status: 201 })

      } catch (txError: any) {
        // P2002 = Unique constraint violation (orderNumber collision)
        if (txError?.code === 'P2002' && attempts < MAX_ATTEMPTS) {
          console.warn(`Order number collision, retrying (attempt ${attempts}/${MAX_ATTEMPTS})`)
          continue
        }
        throw txError
      }
    }

    return NextResponse.json({ success: false, error: 'Failed to create order after retries' }, { status: 500 })

  } catch (error) {
    console.error("Order Creation Error", error)
    return NextResponse.json({ success: false, error: 'Gagal membuat order. Silakan coba lagi.' }, { status: 500 })
  }
}

import { biteship } from '@/lib/biteship'

// PUT /api/orders - Update Order Status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, paymentStatus, adminNotes } = body

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 })
    }

    // 1. Fetch Order and Check Ownership
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        orderItems: { include: { menuItem: true } },
        restaurant: true,
        customer: true
      }
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
      if (!VALID_ORDER_STATUSES.includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid order status' }, { status: 400 })
      }
      updates.status = status
      
      // Handle Delivery Status Transitions
      if (existingOrder.deliveryAddress) {
        if (status === 'CONFIRMED') {
          updates.shippingStatus = 'CONFIRMED'
        } else if (status === 'READY' && !existingOrder.biteshipOrderId) {
          // TRIGGER BITESHIP ORDER CREATION
          try {
            // Robust Normalization for courier_type (Biteship service code)
            let courierCompany = ((existingOrder as any).courierCode || 'gojek').toLowerCase();
            let courierType = ((existingOrder as any).courierService || 'instant').toLowerCase();

            // Handle common service name mismatches
            if (courierType.includes('reguler')) courierType = 'reg';
            if (courierType.includes('standard')) courierType = 'reg';
            if (courierType.includes('instant')) courierType = 'instant';
            if (courierType.includes('same')) courierType = 'sameday';
            if (courierType.includes('kilat')) courierType = 'yes';
            if (courierType.includes('next')) courierType = 'best';
            
            // Clean up any spaces or special characters
            courierType = courierType.replace(/\s+/g, '');

            const biteshipPayload = {
              origin_contact_name: existingOrder.restaurant.name,
              origin_contact_phone: existingOrder.restaurant.phone,
              origin_address: existingOrder.restaurant.address,
              origin_coordinate: {
                latitude: existingOrder.restaurant.latitude,
                longitude: existingOrder.restaurant.longitude
              },
              destination_contact_name: existingOrder.customer.name,
              destination_contact_phone: existingOrder.customer.phone || '08123456789',
              destination_address: existingOrder.deliveryAddress,
              destination_coordinate: {
                latitude: existingOrder.deliveryLat,
                longitude: existingOrder.deliveryLng
              },
              courier_company: courierCompany,
              courier_type: courierType,
              delivery_type: ['gojek', 'grab', 'lalamove', 'borzo', 'maxim'].includes(courierCompany) ? "now" : "later",
              // Add delivery date/time for standard couriers (required by Biteship for 'later' type)
              ...(!['gojek', 'grab', 'lalamove', 'borzo', 'maxim'].includes(courierCompany) ? (() => {
                const now = new Date();
                let deliveryDate = now.toISOString().split('T')[0];
                let deliveryTime = '10:00';
                
                // If it's already late (past 3 PM), set for tomorrow morning
                if (now.getHours() >= 15) {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    deliveryDate = tomorrow.toISOString().split('T')[0];
                    deliveryTime = '09:00';
                } else {
                    // Set to 1 hour from now
                    deliveryTime = `${now.getHours() + 1}:00`;
                }

                return { delivery_date: deliveryDate, delivery_time: deliveryTime };
              })() : {}),
              items: existingOrder.orderItems.map(i => ({
                name: i.menuItem?.name || 'Food Item',
                description: i.notes || '',
                value: i.price,
                quantity: i.quantity,
                weight: 500
              }))
            }

            console.log('[BITESHIP] Sending Create Order Payload:', JSON.stringify(biteshipPayload, null, 2));
            const biteshipRes = await biteship.createOrder(biteshipPayload)
            console.log('[BITESHIP] Create Order Response:', JSON.stringify(biteshipRes, null, 2));
            
            if (biteshipRes.success || biteshipRes.id) {
              updates.biteshipOrderId = biteshipRes.id
              // Waybill ID is often used for standard couriers as the tracking number
              updates.biteshipTrackingId = biteshipRes.courier?.tracking_id || biteshipRes.courier?.waybill_id || biteshipRes.courier?.id
              updates.shippingStatus = 'ON_THE_WAY'
            } else {
              throw new Error(biteshipRes.error || 'Biteship API failed to create order');
            }
          } catch (bsError: any) {
            console.error('Failed to create Biteship order:', bsError)
            return NextResponse.json({ 
              success: false, 
              error: `Gagal menghubungkan ke Biteship: ${bsError.message}. Pastikan saldo cukup dan data alamat/koordinat benar.` 
            }, { status: 400 })
          }
        }
      }

      // If confirming order, assume payment is collected
      if (status === 'CONFIRMED' && !paymentStatus) {
        updates.paymentStatus = 'PAID'
      }
    }

    if (paymentStatus) {
      if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
        return NextResponse.json({ success: false, error: 'Invalid payment status' }, { status: 400 })
      }
      updates.paymentStatus = paymentStatus
    }

    // Allow updating adminNotes
    if (adminNotes !== undefined) {
      updates.adminNotes = sanitizeString(adminNotes, 1000) || null
    }

    // Log manual notifications if provided (Simulated Sending)
    const { manualEmail, manualPhone } = body
    if (status === 'CONFIRMED' && (manualEmail || manualPhone)) {
      console.log(`[NOTIFY] Manual Notification Triggered for Order ${orderId}`)
      if (manualEmail) console.log(`[NOTIFY] Sending Email to: ${manualEmail}`)
      if (manualPhone) console.log(`[NOTIFY] Sending WhatsApp to: ${manualPhone}`)
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
