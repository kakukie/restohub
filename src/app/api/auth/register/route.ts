import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, password, phone, role = 'RESTAURANT_ADMIN', plan = 'FREE_TRIAL' } = body

        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'Name, Email and Password are required' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email already registered' },
                { status: 400 }
            )
        }

        const hashedPassword = await hashPassword(password)

        // Create slug from restaurant name
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 1000)

        // Transaction: Create User + Restaurant
        // Note: Since Prisma's nested writes are powerful, we can do this in one go.
        // However, the schema relations are:
        // Restaurant has adminId -> User.
        // So User must exist first? Or we can create User and nested Restaurant.
        // Wait, Restaurant requires adminId. 
        // Let's create User first, then Restaurant.

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    phone,
                    password: hashedPassword,
                    role: role,
                }
            })

            // 2. Create Restaurant linked to User
            const restaurant = await tx.restaurant.create({
                data: {
                    name,
                    description: 'New Restaurant',
                    phone,
                    adminId: user.id,
                    email,
                    package: plan,
                    status: 'PENDING', // Default to PENDING
                    slug,
                    isActive: true
                }
            })

            return { user, restaurant }
        })

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: result.user.role
                },
                restaurant: result.restaurant
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error('Registration Error:', error)
        console.error('Error Code:', error.code)
        console.error('Error Stack:', error.stack)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error', details: error.message },
            { status: 500 }
        )
    }
}
