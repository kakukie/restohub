import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCache, setCache, invalidateCache } from '@/lib/redis'

async function getRestaurantId(idOrSlug: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { id: idOrSlug },
        { slug: idOrSlug }
      ]
    },
    select: { id: true }
  })
  return restaurant?.id
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantIdParam = searchParams.get('restaurantId')

    const where: any = {}
    if (restaurantIdParam) {
      const resolvedId = await getRestaurantId(restaurantIdParam)
      if (!resolvedId) return NextResponse.json({ success: true, data: [] })
      where.restaurantId = resolvedId

      // Check Cache
      const cacheKey = `categories:${resolvedId}`
      const cached = await getCache(cacheKey)
      if (cached) return NextResponse.json({ success: true, data: cached })
    }

    const categories = await prisma.category.findMany({
      where: { ...where, deletedAt: null },
      orderBy: { displayOrder: 'asc' }
    })

    if (restaurantIdParam && where.restaurantId) {
      await setCache(`categories:${where.restaurantId}`, categories, 300) // 5 min
    }

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, restaurantId } = body

    const resolvedId = await getRestaurantId(restaurantId)
    if (!resolvedId) return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })

    // Check Limits
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: resolvedId },
      select: { maxCategories: true }
    })

    const count = await prisma.category.count({ where: { restaurantId: resolvedId, deletedAt: null } })

    const limit = (restaurant?.maxCategories && restaurant.maxCategories > 5) ? restaurant.maxCategories : 15;

    if (restaurant?.maxCategories !== null && count >= limit) {
      return NextResponse.json({
        success: false,
        error: `Category limit reached (Active: ${count} / Max: ${limit}). Please upgrade your plan.`
      }, { status: 403 })
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        restaurantId: resolvedId,
        displayOrder: count + 1
      }
    })

    // Invalidate
    await invalidateCache(`categories:${resolvedId}`)
    await invalidateCache(`dashboard:${resolvedId}`)

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const updated = await prisma.category.update({
      where: { id },
      data: updates
    })

    // Invalidate
    if (updated.restaurantId) {
      await invalidateCache(`categories:${updated.restaurantId}`)
      await invalidateCache(`dashboard:${updated.restaurantId}`)
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

// DELETE /api/categories - Soft Delete
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false }, { status: 400 })

  try {
    // Soft Delete
    const category = await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: { restaurantId: true }
    })

    if (category.restaurantId) {
      await invalidateCache(`categories:${category.restaurantId}`)
      await invalidateCache(`dashboard:${category.restaurantId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
