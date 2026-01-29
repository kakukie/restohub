import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
