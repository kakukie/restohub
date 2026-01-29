import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users - List all users (Super Admin only ideally)
export async function GET(request: NextRequest) {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        })

        // Remove passwords
        const safeUsers = users.map(user => {
            const { password, ...rest } = user
            return { ...rest, password: '' } // Keep password field but empty, or omit. Frontend expects password field in type?
        })

        return NextResponse.json({
            success: true,
            data: safeUsers
        })
    } catch (error) {
        console.error('Fetch Users Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch users'
        }, { status: 500 })
    }
}

// PUT /api/users - Update User (Profile, Password, Role)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, password, ...updates } = body

        if (!id) {
            return NextResponse.json({
                success: false,
                error: 'User ID is required'
            }, { status: 400 })
        }

        const dataToUpdate: any = { ...updates }

        // Handle password update if provided
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10)
            dataToUpdate.password = hashedPassword
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate
        })

        // Remove password from response
        const { password: _, ...userWithoutPassword } = updatedUser

        return NextResponse.json({
            success: true,
            data: userWithoutPassword,
            message: 'User updated successfully'
        })

    } catch (error) {
        console.error('Update User Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to update user'
        }, { status: 500 })
    }
}
