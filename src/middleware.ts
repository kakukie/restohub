import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Super Admin Route Protection
    if (pathname.startsWith('/admin')) {
        const token = request.cookies.get('adminToken')?.value
        const refreshToken = request.cookies.get('adminRefreshToken')?.value

        const isAccessValid = token ? await verifyJwt(token) : null
        const isRefreshValid = refreshToken ? await verifyJwt(refreshToken) : null

        const validAccess = isAccessValid && isAccessValid.role === 'SUPER_ADMIN'
        const validRefresh = isRefreshValid && isRefreshValid.role === 'SUPER_ADMIN'

        if (!validAccess && !validRefresh) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        return NextResponse.next()
    }

    // Restaurant Admin Route Protection
    let isAccessValid = null
    let isRefreshValid = null
    
    const restoToken = request.cookies.get('restoToken')?.value || request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('adminToken')?.value
    const restoRefreshToken = request.cookies.get('restoRefreshToken')?.value || request.cookies.get('adminRefreshToken')?.value
    
    if (restoToken) {
        isAccessValid = await verifyJwt(restoToken)
    }
    if (!isAccessValid && restoRefreshToken) {
        isRefreshValid = await verifyJwt(restoRefreshToken)
    }

    if (pathname.startsWith('/dashboard')) {
        if (!isAccessValid && !isRefreshValid) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // ─── Global API Protection ───
    const isApi = pathname.startsWith('/api')
    const isStateChange = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
    
    if (isApi && isStateChange) {
        // Whitelisted public state-changing endpoints (minimal exposure)
        const publicPostEndpoints = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/demo',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
            '/api/auth/google',
            '/api/auth/2fa',
            '/api/auth/refresh',
            '/api/orders',           // QR Menu order creation (POST only, auth checked in route handler)
            '/api/payment/midtrans', // Midtrans webhook callback
        ]
        const isPublicEndpoint = publicPostEndpoints.some(p => pathname.startsWith(p))

        if (!isPublicEndpoint) {
            // Unauthenticated Protection
            if (!isAccessValid && !isRefreshValid) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized: Access Token is missing or invalid.' },
                    { status: 401 }
                )
            }

            // Demo Protection
            const activePayload = isAccessValid || isRefreshValid
            const isDemoUser = activePayload?.isDemo === true
            if (isDemoUser && !pathname.includes('/api/auth/logout')) {
                return NextResponse.json(
                    { success: false, error: '🚦 Mode Demo: Anda tidak diizinkan mengubah data.' },
                    { status: 403 }
                )
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/api/:path*'
    ]
}
