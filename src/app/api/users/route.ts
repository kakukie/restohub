import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getAuthenticatedUser, authorizeAction } from '@/lib/api-auth'

// GET /api/users - List all users (Authenticated only)
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role')
        const rolesParam = searchParams.get('roles')
        const restaurantId = searchParams.get('restaurantId')

        const whereClause: any = { deletedAt: null }

        // Non-Super Admins can only see users related to their restaurant
        if (user.role !== 'SUPER_ADMIN') {
            if (!user.restaurantId) {
                return NextResponse.json({ success: true, data: [] })
            }
            whereClause.OR = [
                {
                    role: 'RESTAURANT_ADMIN',
                    restaurants: { some: { id: user.restaurantId } }
                },
                {
                    role: 'CUSTOMER',
                    orders: { some: { restaurantId: user.restaurantId } }
                }
            ]
        } else {
            // Super Admin filtering
            if (restaurantId) {
                whereClause.OR = [
                    {
                        role: 'RESTAURANT_ADMIN',
                        restaurants: { some: { id: restaurantId } }
                    },
                    {
                        role: 'CUSTOMER',
                        orders: { some: { restaurantId: restaurantId } }
                    }
                ]
            } else {
                if (rolesParam) {
                    const roles = rolesParam.split(',')
                    whereClause.role = { in: roles }
                } else if (role) {
                    whereClause.role = role
                }
            }
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { restaurants: true, orders: true }
                },
                restaurants: {
                    select: { id: true, name: true }
                }
            }
        })

        // Remove passwords
        const safeUsers = users.map(user => {
            const { password, twoFactorSecret, resetPasswordToken, ...rest } = user
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

// POST /api/users - Create new User (Super Admin only)
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

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

// PUT /api/users - Update User (Authenticated, self or Super Admin)
export async function PUT(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, password, ...updates } = body

        if (!id) {
            return NextResponse.json({
                success: false,
                error: 'User ID is required'
            }, { status: 400 })
        }

        // Authorization: Only allow self-edit or Super Admin
        if (user.role !== 'SUPER_ADMIN' && user.userId !== id) {
            return NextResponse.json({ success: false, error: 'Forbidden: Cannot edit other users' }, { status: 403 })
        }

        // Demo guard
        const auth = authorizeAction(user, undefined, 'PUT')
        if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })

        const dataToUpdate: any = { ...updates }

        // Prevent non-super-admin from changing roles
        if (user.role !== 'SUPER_ADMIN' && updates.role) {
            delete dataToUpdate.role
        }

        if (updates.email) {
            const existingEmail = await prisma.user.findUnique({ where: { email: updates.email } })
            if (existingEmail && existingEmail.id !== id) {
                return NextResponse.json({
                    success: false,
                    error: 'Email already in use by another user'
                }, { status: 400 })
            }
        }

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

// DELETE /api/users - Soft Delete User (Super Admin only)
export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        if (user.role !== 'SUPER_ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
        }

        await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), password: '' }
        })

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        })
    } catch (error) {
        console.error('Delete User Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to delete user'
        }, { status: 500 })
    }
}
