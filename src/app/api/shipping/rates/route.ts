import { NextRequest, NextResponse } from 'next/server'
import { biteship } from '@/lib/biteship'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, destinationLat, destinationLng, items } = body

    if (!restaurantId || !destinationLat || !destinationLng) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Get restaurant location
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { 
        name: true,
        address: true,
        latitude: true,
        longitude: true
      }
    })

    if (!restaurant || !restaurant.latitude || !restaurant.longitude) {
      return NextResponse.json({ success: false, error: 'Restaurant location not configured' }, { status: 400 })
    }

    // 2. Prepare Biteship payload
    const payload = {
      origin_latitude: restaurant.latitude,
      origin_longitude: restaurant.longitude,
      destination_latitude: destinationLat,
      destination_longitude: destinationLng,
      couriers: 'grab,gojek,shopee', // Popular on-demand couriers in Indonesia
      items: items.map((item: any) => ({
        name: item.name,
        value: item.price,
        quantity: item.quantity,
        weight: 500 // Default weight for food items
      }))
    }

    const rates = await biteship.getRates(payload)

    return NextResponse.json({ success: true, data: rates })
  } catch (error: any) {
    console.error('Shipping Rates API Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch shipping rates' }, { status: 500 })
  }
}
