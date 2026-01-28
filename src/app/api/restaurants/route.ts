import { NextRequest, NextResponse } from 'next/server'

// GET /api/restaurants - Get all restaurants
export async function GET(request: NextRequest) {
  try {
    // Mock data for demo - replace with actual database queries
    const restaurants = [
      {
        id: '1',
        name: 'Warung Rasa Nusantara',
        description: 'Authentic Indonesian cuisine with traditional recipes',
        address: 'Jl. Sudirman No. 123, Jakarta',
        phone: '+62 21 1234 5678',
        email: 'info@warungrasa.com',
        isActive: true,
        totalMenuItems: 45,
        totalOrders: 1250,
        totalRevenue: 125000000
      },
      {
        id: '2',
        name: 'Sushi Master',
        description: 'Fresh and delicious Japanese sushi',
        address: 'Jl. Asia Afrika No. 45, Bandung',
        phone: '+62 22 9876 5432',
        email: 'contact@sushimaster.com',
        isActive: true,
        totalMenuItems: 38,
        totalOrders: 890,
        totalRevenue: 89000000
      },
      {
        id: '3',
        name: 'Pizza Paradise',
        description: 'Italian pizza with premium ingredients',
        address: 'Jl. Diponegoro No. 67, Surabaya',
        phone: '+62 31 4567 8901',
        email: 'hello@pizzaparadise.com',
        isActive: false,
        totalMenuItems: 32,
        totalOrders: 567,
        totalRevenue: 45000000
      }
    ]

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    let filteredRestaurants = restaurants

    if (search) {
      filteredRestaurants = restaurants.filter(rest =>
        rest.name.toLowerCase().includes(search.toLowerCase()) ||
        rest.description?.toLowerCase().includes(search.toLowerCase()) ||
        rest.address?.toLowerCase().includes(search.toLowerCase())
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredRestaurants
    })
  } catch (error) {
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
