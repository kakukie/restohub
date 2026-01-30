import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Define protected paths
    const protectedPaths = ['/dashboard', '/admin']
    const isProtected = protectedPaths.some(path => pathname.startsWith(path))

    if (isProtected) {
        const accessToken = request.cookies.get('accessToken')?.value

        if (!accessToken) {
            // If coming from a client nav, we might checking refresh token... 
            // but for page load, redirect to login
            return NextResponse.redirect(new URL('/', request.url))
        }

        const payload = await verifyJwt(accessToken)
        if (!payload) {
            // Token invalid/expired
            // In a full implementation, we might try to refresh here or let client handle it.
            // For now, redirect to login to ensure security and stability.
            return NextResponse.redirect(new URL('/', request.url))
        }

        // Valid token, proceed
        const response = NextResponse.next()
        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*'
    ]
}
