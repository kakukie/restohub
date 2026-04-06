import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJwt } from '@/lib/jwt'
import { authenticator } from 'otplib'

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('restoToken')?.value || request.cookies.get('adminToken')?.value
        if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const decoded = await verifyJwt(token)
        if (!decoded || !decoded.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
        if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

        const body = await request.json()
        const { action, token: verifyToken } = body // action = 'generate' | 'enable' | 'disable'

        if (action === 'generate') {
            const secret = authenticator.generateSecret()
            const otpauthUrl = authenticator.keyuri(user.email, 'RestoHub', secret)
            return NextResponse.json({ success: true, secret, otpauthUrl })
        } 
        
        else if (action === 'enable') {
            const { secret } = body
            if (!verifyToken || !secret) {
                return NextResponse.json({ success: false, error: 'Token and secret are required' }, { status: 400 })
            }
            
            const isValid = authenticator.verify({ token: verifyToken, secret })
            if (!isValid) {
                return NextResponse.json({ success: false, error: 'Token tidak valid' }, { status: 400 })
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    isTwoFactorEnabled: true,
                    twoFactorSecret: secret
                } as any
            })
            return NextResponse.json({ success: true, message: '2FA berhasil diaktifkan' })
        }
        
        else if (action === 'disable') {
            if (!verifyToken || !(user as any).twoFactorSecret) {
                return NextResponse.json({ success: false, error: 'Token mandatory / 2FA was not enabled' }, { status: 400 })
            }
            
            const isValid = authenticator.verify({ token: verifyToken, secret: (user as any).twoFactorSecret })
            if (!isValid) {
                return NextResponse.json({ success: false, error: 'Token tidak valid' }, { status: 400 })
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    isTwoFactorEnabled: false,
                    twoFactorSecret: null
                } as any
            })
            return NextResponse.json({ success: true, message: '2FA berhasil dinonaktifkan' })
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })

    } catch (error: any) {
        console.error('2FA Setup Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
