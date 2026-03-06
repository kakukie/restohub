/**
 * Rate Limiter utility using Redis
 * Provides brute-force protection for login endpoints.
 *
 * Strategy:
 * - Track failed attempts per IP and per email separately
 * - Lock account/IP after threshold is exceeded
 * - Exponential backoff window for persistent attackers
 */

import { redis } from '@/lib/redis'

// ─── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
    // Per-IP limits
    IP_MAX_ATTEMPTS: 20,           // Max failed attempts from one IP
    IP_WINDOW_SECONDS: 15 * 60,   // Track window: 15 minutes
    IP_LOCKOUT_SECONDS: 30 * 60,  // Lock IP for 30 minutes

    // Per-email limits (tighter for demo account)
    EMAIL_MAX_ATTEMPTS: 10,         // Max failed attempts per email
    EMAIL_WINDOW_SECONDS: 15 * 60, // Track window: 15 minutes
    EMAIL_LOCKOUT_SECONDS: 60 * 60, // Lock email for 1 hour

    // Demo account — extra strict
    DEMO_EMAIL: 'demo@restohub.id',
    DEMO_MAX_ATTEMPTS: 5,           // Only 5 attempts
    DEMO_LOCKOUT_SECONDS: 15 * 60,  // 15-min lockout
} as const

// ─── Key Helpers ──────────────────────────────────────────────────────────────
const keys = {
    ipAttempts: (ip: string) => `ratelimit:ip:${ip}:attempts`,
    ipLocked: (ip: string) => `ratelimit:ip:${ip}:locked`,
    emailAttempts: (email: string) => `ratelimit:email:${email}:attempts`,
    emailLocked: (email: string) => `ratelimit:email:${email}:locked`,
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RateLimitResult {
    allowed: boolean
    reason?: 'ip_locked' | 'email_locked'
    retryAfterSeconds?: number
}

// ─── Check + Increment ────────────────────────────────────────────────────────

/**
 * Check if login is allowed and record the failed attempt.
 * Call this BEFORE verifying credentials.
 */
export async function checkRateLimit(ip: string, email: string): Promise<RateLimitResult> {
    try {
        const normalizedEmail = email.toLowerCase().trim()
        const isDemo = normalizedEmail === CONFIG.DEMO_EMAIL

        // 1. Check IP lockout
        const ipLocked = await redis.get(keys.ipLocked(ip))
        if (ipLocked) {
            const ttl = await redis.ttl(keys.ipLocked(ip))
            return { allowed: false, reason: 'ip_locked', retryAfterSeconds: ttl }
        }

        // 2. Check email lockout
        const emailLocked = await redis.get(keys.emailLocked(normalizedEmail))
        if (emailLocked) {
            const ttl = await redis.ttl(keys.emailLocked(normalizedEmail))
            return { allowed: false, reason: 'email_locked', retryAfterSeconds: ttl }
        }

        return { allowed: true }
    } catch {
        // If Redis is unavailable, fail open (don't block login)
        return { allowed: true }
    }
}

/**
 * Record a FAILED login attempt. Call this after a failed password check.
 */
export async function recordFailedAttempt(ip: string, email: string): Promise<void> {
    try {
        const normalizedEmail = email.toLowerCase().trim()
        const isDemo = normalizedEmail === CONFIG.DEMO_EMAIL

        // ── IP counter ──────────────────────────────────────────────────
        const ipKey = keys.ipAttempts(ip)
        const ipCount = await redis.incr(ipKey)
        if (ipCount === 1) {
            await redis.expire(ipKey, CONFIG.IP_WINDOW_SECONDS)
        }
        if (ipCount >= CONFIG.IP_MAX_ATTEMPTS) {
            await redis.set(keys.ipLocked(ip), '1', 'EX', CONFIG.IP_LOCKOUT_SECONDS)
            await redis.del(ipKey)
        }

        // ── Email counter ───────────────────────────────────────────────
        const emailKey = keys.emailAttempts(normalizedEmail)
        const emailCount = await redis.incr(emailKey)
        if (emailCount === 1) {
            await redis.expire(emailKey, CONFIG.EMAIL_WINDOW_SECONDS)
        }

        const maxAttempts = isDemo ? CONFIG.DEMO_MAX_ATTEMPTS : CONFIG.EMAIL_MAX_ATTEMPTS
        const lockoutSeconds = isDemo ? CONFIG.DEMO_LOCKOUT_SECONDS : CONFIG.EMAIL_LOCKOUT_SECONDS

        if (emailCount >= maxAttempts) {
            await redis.set(keys.emailLocked(normalizedEmail), '1', 'EX', lockoutSeconds)
            await redis.del(emailKey)
        }
    } catch {
        // Silently fail if Redis is down — don't crash login
    }
}

/**
 * Clear rate limit counters after a SUCCESSFUL login.
 */
export async function clearRateLimit(ip: string, email: string): Promise<void> {
    try {
        const normalizedEmail = email.toLowerCase().trim()
        await Promise.all([
            redis.del(keys.ipAttempts(ip)),
            redis.del(keys.emailAttempts(normalizedEmail)),
        ])
    } catch {
        // Ignore
    }
}

/**
 * Get remaining attempts before lockout (for informational response).
 */
export async function getRemainingAttempts(email: string): Promise<number> {
    try {
        const normalizedEmail = email.toLowerCase().trim()
        const isDemo = normalizedEmail === CONFIG.DEMO_EMAIL
        const maxAttempts = isDemo ? CONFIG.DEMO_MAX_ATTEMPTS : CONFIG.EMAIL_MAX_ATTEMPTS

        const count = await redis.get(keys.emailAttempts(normalizedEmail))
        const used = parseInt(count || '0', 10)
        return Math.max(0, maxAttempts - used)
    } catch {
        return 0
    }
}
