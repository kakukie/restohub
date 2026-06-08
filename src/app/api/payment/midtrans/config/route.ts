import { NextResponse } from 'next/server'
import { getMidtransConfig, isMidtransConfigured } from '@/lib/midtrans'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { clientKey, isProduction, serverKey } = getMidtransConfig()

    return NextResponse.json({
        success: true,
        data: {
            clientKey: isMidtransConfigured() ? clientKey : '',
            isProduction,
            serverKeyPrefix: serverKey.slice(0, 12),
            clientKeyPrefix: clientKey.slice(0, 12),
        },
    })
}
