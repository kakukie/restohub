import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import {
    checkRateLimit,
    recordFailedAttempt,
    clearRateLimit,
    getRemainingAttempts,
} from '@/lib/rateLimiter'

// ─── Input Validation ─────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254   // RFC 5321
const MAX_PASSWORD_LENGTH = 128

function sanitizeString(str: unknown): string {
    if (typeof str !== 'string') return ''
    // Trim whitespace, remove null bytes and control chars
    return str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
}

function validateLoginInput(email: string, password: string): string | null {
    if (!email || !password) return 'Email and password are required'
    if (email.length > MAX_EMAIL_LENGTH) return 'Invalid email or password'
    if (password.length > MAX_PASSWORD_LENGTH) return 'Invalid email or password'
    if (!EMAIL_REGEX.test(email)) return 'Invalid email or password'
    // Reject obviously suspicious patterns (SQL injection probes)
    const suspiciousPatterns = [/['";\\]/, /--/, /\/\*/, /\bOR\b/i, /\bUNION\b/i, /\bSELECT\b/i, /\bDROP\b/i]
    if (suspiciousPatterns.some(p => p.test(email) || p.test(password))) {
        return 'Invalid email or password'
    }
    return null
}

// ─── Get real client IP (works behind Nginx proxy) ───────────────────────────
function getClientIp(request: NextRequest): string {
    const xff = request.headers.get('x-forwarded-for')
    if (xff) {
        const firstIp = xff.split(',')[0].trim()
        // Validate it's actually an IP-like string to prevent spoofing
        if (/^[\d.:a-fA-F]+$/.test(firstIp)) return firstIp
    }
    return request.headers.get('x-real-ip') || '0.0.0.0'
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null)
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Invalid request body' },
                { status: 400 }
            )
        }

        // ── Sanitize inputs ───────────────────────────────────────────────
        const email = sanitizeString(body.email).toLowerCase()
        const password = sanitizeString(body.password)

        // ── Validate inputs ───────────────────────────────────────────────
        const validationError = validateLoginInput(email, password)
        if (validationError) {
            return NextResponse.json(
                { success: false, error: validationError },
                { status: 400 }
            )
        }

        // ── Rate limit check (BEFORE any DB query) ────────────────────────
        const clientIp = getClientIp(request)
        const rateLimitResult = await checkRateLimit(clientIp, email)

        if (!rateLimitResult.allowed) {
            const retryMins = Math.ceil((rateLimitResult.retryAfterSeconds ?? 60) / 60)
            return NextResponse.json(
                {
                    success: false,
                    error: `Too many failed login attempts. Please try again in ${retryMins} minute${retryMins !== 1 ? 's' : ''}.`,
                    retryAfter: rateLimitResult.retryAfterSeconds,
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimitResult.retryAfterSeconds ?? 60),
                        'X-RateLimit-Reason': rateLimitResult.reason ?? 'rate_limited',
                    },
                }
            )
        }

        // ── Find User (Prisma parameterized — safe from SQL injection) ────
        const user = await prisma.user.findUnique({
            where: { email },
            include: { restaurants: true }
        })

        // ── Unified error response (prevents user enumeration) ────────────
        const authFail = async () => {
            await recordFailedAttempt(clientIp, email)
            const remaining = await getRemainingAttempts(email)
            const message = remaining > 0
                ? `Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
                : 'Invalid email or password.'
            return NextResponse.json(
                { success: false, error: message },
                { status: 401 }
            )
        }

        if (!user || !user.password || user.deletedAt !== null) {
            return await authFail()
        }

        // ── Demo account: only allow RESTAURANT_ADMIN role ────────────────
        if (email === 'demo@restohub.id' && user.role !== 'RESTAURANT_ADMIN') {
            return await authFail()
        }

        // ── Verify password ───────────────────────────────────────────────
        const isValid = await comparePassword(password, user.password)
        if (!isValid) {
            return await authFail()
        }

        // ── Clear rate limit on successful login ──────────────────────────
        await clearRateLimit(clientIp, email)

        // ── Retrieve the first restaurant ─────────────────────────────────
        const restaurant = user.restaurants.find(r => !r.deletedAt) ?? user.restaurants[0]

        // ── Check Restaurant Status ───────────────────────────────────────
        if (user.role === 'RESTAURANT_ADMIN' && restaurant) {
            if (restaurant.status === 'PENDING') {
                return NextResponse.json(
                    { success: false, error: 'Account pending approval. Please wait for admin verification.' },
                    { status: 403 }
                )
            }
            if (restaurant.status === 'REJECTED' || !restaurant.isActive) {
                return NextResponse.json(
                    { success: false, error: 'Account is inactive or suspended.' },
                    { status: 403 }
                )
            }
        }

        // ── Generate Tokens ───────────────────────────────────────────────
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            restaurantId: restaurant?.id
        }

        const accessToken = await signAccessToken(tokenPayload)
        const refreshToken = await signRefreshToken(tokenPayload)

        // Store Refresh Token in Database
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        await prisma.refreshToken.create({
            data: { token: refreshToken, userId: user.id, expiresAt }
        })

        // Determine Cookie Name based on Role
        const cookieName = user.role === 'SUPER_ADMIN' ? 'adminToken' : 'restoToken'
        const refreshCookieName = user.role === 'SUPER_ADMIN' ? 'adminRefreshToken' : 'restoRefreshToken'

        // Set Cookies
        const cookieStore = await cookies()
        cookieStore.set(cookieName, accessToken, {
            httpOnly: true,
            secure: process.env.USE_SECURE_COOKIES === 'true',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 mins
            path: '/'
        })
        cookieStore.set(refreshCookieName, refreshToken, {
            httpOnly: true,
            secure: process.env.USE_SECURE_COOKIES === 'true',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/'
        })
        cookieStore.set('lastRole', user.role, { path: '/' })

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                restaurantId: restaurant?.id,
                accessToken
            }
        })

    } catch (error: any) {
        console.error('Login Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
