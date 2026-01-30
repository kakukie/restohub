import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJwt } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Super Admin Route Protection
    if (pathname.startsWith('/admin')) {
        const token = request.cookies.get('adminToken')?.value
        if (!token) return NextResponse.redirect(new URL('/', request.url))

        const payload = await verifyJwt(token)
        if (!payload || payload.role !== 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return NextResponse.next()
    }

    // Restaurant Admin Route Protection
    if (pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('restoToken')?.value
        if (!token) return NextResponse.redirect(new URL('/', request.url))

        const payload = await verifyJwt(token)
        if (!payload) return NextResponse.redirect(new URL('/', request.url))
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
