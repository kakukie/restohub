import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

// ─── Input Validation ────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const MAX_NAME_LENGTH = 100

function sanitizeString(str: unknown, maxLen = 200): string {
    if (typeof str !== 'string') return ''
    return str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLen)
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const rawName = sanitizeString(body.name, MAX_NAME_LENGTH)
        const rawEmail = sanitizeString(body.email, 254).toLowerCase()
        const rawPassword = body.password
        const rawPhone = sanitizeString(body.phone, 20)
        const plan = sanitizeString(body.plan, 30) || 'FREE_TRIAL'

        // Validation
        if (!rawName || !rawEmail || !rawPassword) {
            return NextResponse.json(
                { success: false, error: 'Name, Email and Password are required' },
                { status: 400 }
            )
        }

        if (!EMAIL_REGEX.test(rawEmail)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            )
        }

        if (typeof rawPassword !== 'string' || rawPassword.length < MIN_PASSWORD_LENGTH) {
            return NextResponse.json(
                { success: false, error: `Password minimum ${MIN_PASSWORD_LENGTH} characters` },
                { status: 400 }
            )
        }

        if (rawPassword.length > 128) {
            return NextResponse.json(
                { success: false, error: 'Password too long' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: rawEmail },
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email already registered' },
                { status: 400 }
            )
        }

        const hashedPassword = await hashPassword(rawPassword)

        // Create slug from restaurant name
        const slug = rawName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 1000)

        const isFreePlan = (plan || '').toUpperCase().includes('FREE')
        const trialEndsAt = isFreePlan ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User — always as RESTAURANT_ADMIN (ignore client-sent role to prevent privilege escalation)
            const user = await tx.user.create({
                data: {
                    name: rawName,
                    email: rawEmail,
                    phone: rawPhone,
                    password: hashedPassword,
                    role: 'RESTAURANT_ADMIN',
                }
            })

            // 2. Create Restaurant linked to User
            const restaurant = await tx.restaurant.create({
                data: {
                    name: rawName,
                    description: 'New Restaurant',
                    phone: rawPhone,
                    adminId: user.id,
                    email: rawEmail,
                    package: plan,
                    status: isFreePlan ? 'ACTIVE' : 'PENDING',
                    slug,
                    isActive: true,
                    freeTrialEndsAt: trialEndsAt
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
        return NextResponse.json(
            { success: false, error: 'Registration failed. Please try again.' },
            { status: 500 }
        )
    }
}
