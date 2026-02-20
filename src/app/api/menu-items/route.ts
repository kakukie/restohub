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

// POST: Create Menu Item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Fix: Exclude category/categoryName objects to prevent Prisma validation error
    const {
      name,
      price,
      categoryId,
      restaurantId,
      description,
      isAvailable,
      image,
      category,     // Exclude
      categoryName, // Exclude
      createdAt,    // Exclude
      updatedAt     // Exclude
    } = body

    if (!name || !price || !categoryId || !restaurantId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const resolvedId = await getRestaurantId(restaurantId)
    if (!resolvedId) return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })

    // Check Limits
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: resolvedId },
      select: { maxMenuItems: true }
    })
    const count = await prisma.menuItem.count({ where: { restaurantId: resolvedId, deletedAt: null } })

    if (restaurant?.maxMenuItems !== null && restaurant?.maxMenuItems !== undefined && count >= restaurant.maxMenuItems) {
      return NextResponse.json({ success: false, error: `Menu item limit reached (${restaurant.maxMenuItems} items). Upgrade your plan.` }, { status: 403 })
    }

    const newItem = await prisma.menuItem.create({
      data: {
        name,
        price,
        categoryId,
        restaurantId: resolvedId,
        description,
        isAvailable: isAvailable ?? true,
        image,
        displayOrder: count + 1
      }
    })

    return NextResponse.json({ success: true, data: newItem }, { status: 201 })
  } catch (error) {
    console.error("Create Menu Item Error", error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// PUT: Update Menu Item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    // Fix: Exclude category object and other non-scalar fields that Prisma might reject in 'data'
    const { id, restaurantId, createdAt, updatedAt, category, categoryName, ...updates } = body

    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

    const updated = await prisma.menuItem.update({
      where: { id },
      data: updates
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Update Menu Item Error", error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

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
