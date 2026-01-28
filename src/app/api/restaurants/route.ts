import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/restaurants - Get all restaurants
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { address: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}

    const restaurants = await prisma.restaurant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { menuItems: true, orders: true }
        }
      }
    })

    // Transform data to match expected frontend format if necessary
    // or just return as is. The database schema mostly aligns.
    // We need to map `_count` to flat properties if the frontend expects them.
    const formattedRestaurants = restaurants.map(r => ({
      ...r,
      totalMenuItems: r._count.menuItems,
      totalOrders: r._count.orders,
      totalRevenue: 0 // We would need to aggregate orders for this. For now implementation, 0 or simple aggregation if feasible.
    }))

    return NextResponse.json({
      success: true,
      data: formattedRestaurants
    })
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch restaurants'
    }, { status: 500 })
  }
}

// POST /api/restaurants - Create a new restaurant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, address, phone, email } = body

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Name is required'
      }, { status: 400 })
    }

    // Mock restaurant creation
    const newRestaurant = {
      id: crypto.randomUUID(),
      name,
      description,
      address,
      phone,
      email,
      isActive: true,
      totalMenuItems: 0,
      totalOrders: 0,
      totalRevenue: 0
    }

    return NextResponse.json({
      success: true,
      data: newRestaurant
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create restaurant'
    }, { status: 500 })
  }
}
