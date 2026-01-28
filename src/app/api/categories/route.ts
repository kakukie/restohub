import { NextRequest, NextResponse } from 'next/server'

// GET /api/categories - Get categories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get('restaurantId')

    // Mock data for demo
    const categories = [
      {
        id: '1',
        name: 'Main Course',
        description: 'Main dishes',
        displayOrder: 1,
        isActive: true
      },
      {
        id: '2',
        name: 'Appetizer',
        description: 'Starters and snacks',
        displayOrder: 2,
        isActive: true
      },
      {
        id: '3',
        name: 'Beverage',
        description: 'Drinks',
        displayOrder: 3,
        isActive: true
      }
    ]

    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories'
    }, { status: 500 })
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Name is required'
      }, { status: 400 })
    }

    const newCategory = {
      id: crypto.randomUUID(),
      name,
      description,
      displayOrder: 0,
      isActive: true
    }

    return NextResponse.json({
      success: true,
      data: newCategory
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create category'
    }, { status: 500 })
  }
}
