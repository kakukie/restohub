import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { menuItemId, type, quantity, reason, expiryDate } = body

    if (!menuItemId || !type || quantity === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId }
    })

    if (!menuItem) return NextResponse.json({ success: false, error: 'Menu item not found' }, { status: 404 })

    const auth = authorizeAction(user, menuItem.restaurantId, 'POST')
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    const prevStock = menuItem.stock
    let newStock = prevStock

    if (type === 'STOCK_IN' || type === 'RETURN_GOOD' || type === 'ADJUSTMENT') {
      newStock += quantity
    } else if (type === 'WASTE' || type === 'RETURN_DAMAGED' || type === 'SALE') {
      newStock -= quantity
    } else if (type === 'CORRECTION') {
      newStock = quantity
    }

    const movement = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.menuItem.update({
        where: { id: menuItemId },
        data: { 
          stock: newStock,
          expiryDate: expiryDate ? new Date(expiryDate) : menuItem.expiryDate
        }
      })

      return await tx.stockMovement.create({
        data: {
          menuItemId,
          restaurantId: menuItem.restaurantId,
          type,
          quantity,
          previousStock: prevStock,
          newStock,
          reason,
          expiryDate: expiryDate ? new Date(expiryDate) : null
        }
      })
    })

    return NextResponse.json({ success: true, data: movement })
  } catch (error) {
    console.error("Stock Adjustment Error", error)
    return NextResponse.json({ success: false, error: 'Failed to adjust stock' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurantId')
    const menuItemId = searchParams.get('menuItemId')

    const user = await getAuthenticatedUser(request)
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    if (!restaurantId) return NextResponse.json({ success: false, error: 'Restaurant ID required' }, { status: 400 })

    const auth = authorizeAction(user, restaurantId, 'GET')
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

    const where: any = { restaurantId }
    if (menuItemId) where.menuItemId = menuItemId

    const movements = await prisma.stockMovement.findMany({
      where,
      include: { menuItem: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ success: true, data: movements })
  } catch (error) {
    console.error("Fetch Stock Movements Error", error)
    return NextResponse.json({ success: false, error: 'Failed to fetch movements' }, { status: 500 })
  }
}
