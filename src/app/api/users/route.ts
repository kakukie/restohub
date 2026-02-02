import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/users - List all users (Super Admin only ideally)
export async function GET(request: NextRequest) {
    try {
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { restaurants: true }
                }
            }
        })

        // Remove passwords
        const safeUsers = users.map(user => {
            const { password, ...rest } = user
            return { ...rest, password: '' }
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

// ... POST ...

// ... PUT ...

// DELETE /api/users - Soft Delete User
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
        }

        await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), password: '' } // Clear password security measure
        })

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        })
    } catch (error) {
        console.error('Delete User Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to delete user' // likely FK constraint if hard delete, but soft delete should pass unless ID invalid
        }, { status: 500 })
    }
}

// POST /api/users - Create new User
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, password, role, phone } = body

        if (!name || !email || !password || !role) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 })
        }

        // Check duplicate
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({
                success: false,
                error: 'Email already exists'
            }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                phone: phone || ''
            }
        })

        const { password: _, ...safeUser } = newUser

        return NextResponse.json({
            success: true,
            data: safeUser,
            message: 'User created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Create User Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to create user'
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
