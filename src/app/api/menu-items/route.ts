import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

async function getRestaurantId(idOrSlug: string) {
  if (!idOrSlug) return null

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    select: { id: true }
  })

  if (!restaurant) {
    console.error(`getRestaurantId failed for input: ${idOrSlug}`)
  }
  return restaurant?.id
}

// GET /api/menu-items - Get menu items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantIdParam = searchParams.get('restaurantId')
    const categoryId = searchParams.get('categoryId')

    const where: any = {
      deletedAt: null // Only active items
    }

    if (restaurantIdParam) {
      const resolvedId = await getRestaurantId(restaurantIdParam)
      if (!resolvedId) return NextResponse.json({ success: true, data: [] })
      where.restaurantId = resolvedId
    }

    if (categoryId) where.categoryId = categoryId

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: { displayOrder: 'asc' }
    })

    return NextResponse.json({ success: true, data: menuItems })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// ... POST (remains same) ...

// ... PUT (remains same) ...

// DELETE /api/menu-items - Soft Delete
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false }, { status: 400 })

  try {
    // Check if item exists
    const existing = await prisma.menuItem.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    // Soft Delete
    await prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete Error", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
