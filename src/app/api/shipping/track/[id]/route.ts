import { NextRequest, NextResponse } from 'next/server'
import { biteship } from '@/lib/biteship'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 1. Get order from DB to get biteshipOrderId
    const order = await prisma.order.findUnique({
      where: { id },
      select: { biteshipOrderId: true, courierCode: true }
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (!order.biteshipOrderId) {
        // Fallback for orders not yet sent to Biteship
        return NextResponse.json({ 
            success: true, 
            data: { 
                status: 'pending',
                courier: { company: order.courierCode || 'biteship' },
                history: []
            } 
        })
    }

    // 2. Fetch real-time tracking from Biteship
    const trackingData = await biteship.getTracking(order.biteshipOrderId)
    
    // AUTO-REPAIR: If DB is missing tracking ID but Biteship has it, update DB
    // This handles cases where standard courier waybills are generated later
    if (trackingData?.courier) {
        const realTrackingId = trackingData.courier.waybill_id || trackingData.courier.tracking_id || trackingData.id;
        if (realTrackingId && !realTrackingId.toString().startsWith('mock_')) {
            // We need to fetch the full order object if we want to update it properly
            // but we can just use the 'id' from params
            await prisma.order.update({
                where: { id: (await params).id },
                data: { biteshipTrackingId: realTrackingId.toString() }
            }).catch(e => console.error('Auto-repair update failed:', e));
            console.log(`[TRACKING] Auto-repaired missing tracking ID for order: ${realTrackingId}`);
        }
    }
    
    return NextResponse.json({ success: true, data: trackingData })
  } catch (error: any) {
    console.error('Fetch Tracking Error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
