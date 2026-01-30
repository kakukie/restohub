'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { usePathname } from 'next/navigation'

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const checkSession = useAppStore(state => state.checkSession)
    const pathname = usePathname()

    useEffect(() => {
        // Determine context based on URL
        let role: string | undefined = undefined
        if (pathname?.startsWith('/admin')) {
            role = 'SUPER_ADMIN'
        } else if (pathname?.startsWith('/dashboard')) {
            role = 'RESTAURANT_ADMIN'
        }

        // Initialize session for this tab/window context
        checkSession(role)

    }, [checkSession, pathname])

    return <>{children}</>
}
