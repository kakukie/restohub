import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Super Admin Route Protection
    if (pathname.startsWith('/admin')) {
        const token = request.cookies.get('adminToken')?.value
        const refreshToken = request.cookies.get('adminRefreshToken')?.value

        // Relaxed Check: Allow if EITHER token is valid JWT.
        // API will enforce strict DB checks and rotation.
        const isAccessValid = token ? await verifyJwt(token) : null
        const isRefreshValid = refreshToken ? await verifyJwt(refreshToken) : null

        // Ensure role match if possible (payload has role)
        const validAccess = isAccessValid && isAccessValid.role === 'SUPER_ADMIN'
        const validRefresh = isRefreshValid && isRefreshValid.role === 'SUPER_ADMIN'

        if (!validAccess && !validRefresh) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return NextResponse.next()
    }

    // Restaurant Admin Route Protection
    if (pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('restoToken')?.value
        const refreshToken = request.cookies.get('restoRefreshToken')?.value

        const isAccessValid = token ? await verifyJwt(token) : null
        const isRefreshValid = refreshToken ? await verifyJwt(refreshToken) : null

        if (!isAccessValid && !isRefreshValid) {
            return NextResponse.redirect(new URL('/', request.url))
        }

        // ─── Global Demo Protection ───
        // If it's an API call and we're in Demo mode, block state changes.
        const activePayload = isAccessValid || isRefreshValid
        const isDemoUser = activePayload?.isDemo === true
        const isApi = pathname.startsWith('/api')
        const isStateChange = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)

        if (isDemoUser && isApi && isStateChange) {
            // Exceptions: allow demo to login/logout or specific non-harmful APIs
            if (!pathname.includes('/api/auth/logout')) {
                return NextResponse.json(
                    { success: false, error: '🚦 Mode Demo: Anda tidak diizinkan mengubah data.' },
                    { status: 403 }
                )
            }
        }

        return NextResponse.next()
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
