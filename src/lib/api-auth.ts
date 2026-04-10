import { NextRequest } from 'next/server'
import { verifyJwt } from './jwt'

export interface AuthUser {
    userId: string
    email: string
    role: 'RESTAURANT_ADMIN' | 'SUPER_ADMIN' | 'CUSTOMER' | 'STAFF'
    restaurantId?: string
    isDemo?: boolean
}

/**
 * Get the currently authenticated user from cookies or Authorization header.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
    const token = request.cookies.get('restoToken')?.value || 
                  request.cookies.get('adminToken')?.value ||
                  request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) return null

    const payload = await verifyJwt(token)
    if (!payload) return null

    return {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as any,
        restaurantId: payload.restaurantId as string,
        isDemo: !!payload.isDemo
    }
}

/**
 * Validates that the user has permission to access/modify a resource.
 * Also enforces Read-Only mode for Demo users on state-changing methods.
 */
export function authorizeAction(user: AuthUser, restaurantId?: string, method: string = 'GET') {
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())

    // 1. Guard against Demo User making changes
    if (user.isDemo && isStateChanging) {
        return { 
            authorized: false, 
            status: 403, 
            error: '🚦 Mode Demo: Anda tidak diizinkan mengubah data. Silakan daftar akun gratis untuk mencoba fitur penuh.' 
        }
    }

    // 2. Authorize based on Restaurant ID (IDOR protection)
    // Super Admin ignores these checks.
    if (user.role === 'SUPER_ADMIN') return { authorized: true }

    if (restaurantId && user.restaurantId !== restaurantId) {
        return { 
            authorized: false, 
            status: 403, 
            error: '🚫 Akses Ditolak: Anda tidak memiliki izin untuk mengelola restoran ini.' 
        }
    }

    return { authorized: true }
}
