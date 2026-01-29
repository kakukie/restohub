import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/menu-items - Get menu items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurantId')
    const categoryId = searchParams.get('categoryId')

    const where: any = {}
    if (restaurantId) where.restaurantId = restaurantId
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

// POST /api/menu-items - Create
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, categoryId, restaurantId, description, image, isAvailable } = body

    if (!description) body.description = '' // Handle optional

    const count = await prisma.menuItem.count({ where: { restaurantId } })

    const newItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId,
        restaurantId,
        image,
        isAvailable: isAvailable ?? true,
        displayOrder: count + 1
      }
    })

    return NextResponse.json({ success: true, data: newItem }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// PUT /api/menu-items - Update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    // Validate price if present
    if (updates.price) updates.price = parseFloat(updates.price)

    const updated = await prisma.menuItem.update({
      where: { id },
      data: updates
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// DELETE /api/menu-items - Delete
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false }, { status: 400 })

  try {
    await prisma.menuItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
