import { NextRequest, NextResponse } from 'next/server'
import { biteship } from '@/lib/biteship'
import prisma from '@/lib/prisma'

const DEFAULT_COURIERS = 'gojek,grab'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, destinationLat, destinationLng, items = [] } = body

    if (!restaurantId || !destinationLat || !destinationLng) {
      return NextResponse.json({ success: false, error: 'Missing required fields (restaurantId, destinationLat, destinationLng)' }, { status: 400 })
    }

    if (!prisma) {
      console.error('Prisma client is not initialized!')
      return NextResponse.json({ success: false, error: 'Internal database error' }, { status: 500 })
    }

    // 1. Get restaurant location AND delivery courier settings
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { 
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        deliveryCouriers: true
      }
    })

    if (!restaurant || restaurant.latitude === null || restaurant.longitude === null) {
      return NextResponse.json({ 
        success: false, 
        error: 'Koordinat lokasi restoran belum diatur. Silakan atur di Dashboard Admin (Menu Pengaturan > Tab Lokasi).' 
      }, { status: 400 })
    }

    // 2. Determine which couriers to query
    const courierCodes = restaurant.deliveryCouriers && restaurant.deliveryCouriers.length > 0
      ? restaurant.deliveryCouriers.join(',')
      : DEFAULT_COURIERS

    // 3. Prepare Biteship payload
    const payload = {
      origin_latitude: restaurant.latitude,
      origin_longitude: restaurant.longitude,
      destination_latitude: destinationLat,
      destination_longitude: destinationLng,
      couriers: courierCodes,
      items: items.map((item: any) => ({
        name: item.name,
        value: item.price,
        quantity: item.quantity,
        weight: 500 // Default weight for food items
      }))
    }

    const rates = await biteship.getRates(payload)

    // 4. Filter mock rates by restaurant's enabled couriers (for mock/hybrid mode)
    if (rates?.pricing && restaurant.deliveryCouriers && restaurant.deliveryCouriers.length > 0) {
      rates.pricing = rates.pricing.filter((r: any) => 
        restaurant.deliveryCouriers.includes(r.courier_code)
      )
    }

    return NextResponse.json({ success: true, data: rates })
  } catch (error: any) {
    console.error('Shipping Rates API Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch shipping rates' }, { status: 500 })
  }
}
