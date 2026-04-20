import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/api-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = params.id
    const user = await getAuthenticatedUser(request)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin only' }, { status: 401 })
    }

    const body = await request.json()
    const { enabledFeatures } = body // Expected: string[]

    if (!Array.isArray(enabledFeatures)) {
      return NextResponse.json({ success: false, error: 'Invalid features format' }, { status: 400 })
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { enabledFeatures }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error("Update Features Error", error)
    return NextResponse.json({ success: false, error: 'Failed to update features' }, { status: 500 })
  }
}
