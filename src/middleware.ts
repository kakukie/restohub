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
        return NextResponse.next()
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*'
    ]
}
