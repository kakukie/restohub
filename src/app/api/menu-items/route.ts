import { NextRequest, NextResponse } from 'next/server'

// GET /api/menu-items - Get menu items for a restaurant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurantId')

    // Mock data for demo
    const menuItems = [
      {
        id: '1',
        name: 'Nasi Goreng Spesial',
        description: 'Fried rice with special spices and toppings',
        price: 35000,
        categoryName: 'Main Course',
        categoryId: '1',
        isAvailable: true
      },
      {
        id: '2',
        name: 'Sate Ayam',
        description: 'Grilled chicken skewers with peanut sauce',
        price: 25000,
        categoryName: 'Appetizer',
        categoryId: '2',
        isAvailable: true
      },
      {
        id: '3',
        name: 'Rendang',
        description: 'Slow-cooked beef in coconut milk',
        price: 45000,
        categoryName: 'Main Course',
        categoryId: '1',
        isAvailable: true
      },
      {
        id: '4',
        name: 'Es Teh Manis',
        description: 'Sweet iced tea',
        price: 8000,
        categoryName: 'Beverage',
        categoryId: '3',
        isAvailable: true
      }
    ]

    return NextResponse.json({
      success: true,
      data: menuItems
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch menu items'
    }, { status: 500 })
  }
}

// POST /api/menu-items - Create a new menu item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, categoryId, image } = body

    if (!name || !price || !categoryId) {
      return NextResponse.json({
        success: false,
        error: 'Name, price, and category are required'
      }, { status: 400 })
    }

    const newMenuItem = {
      id: crypto.randomUUID(),
      name,
      description,
      price,
      categoryId,
      image,
      isAvailable: true
    }

    return NextResponse.json({
      success: true,
      data: newMenuItem
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create menu item'
    }, { status: 500 })
  }
}
