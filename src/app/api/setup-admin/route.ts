import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
    try {
        const password = await bcrypt.hash('superadmin123', 10)

        // Create or Update Super Admin
        const user = await prisma.user.upsert({
            where: { email: 'super@meenuin.biz.id' },
            update: {
                password: password,
                role: 'SUPER_ADMIN'
            },
            create: {
                name: 'Super Admin Utama',
                email: 'super@meenuin.biz.id',
                password: password,
                role: 'SUPER_ADMIN',
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Super Admin created/reset successfully',
            credentials: {
                email: 'super@meenuin.biz.id',
                password: 'superadmin123'
            },
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
