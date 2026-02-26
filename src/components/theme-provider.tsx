"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { usePathname } from "next/navigation"

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    const pathname = usePathname()
    let forcedTheme: string | undefined = undefined

    if (pathname === '/') {
        forcedTheme = 'light'
    } else if (pathname?.startsWith('/admin')) {
        forcedTheme = 'dark'
    }

    return (
        <NextThemesProvider {...props} forcedTheme={forcedTheme}>
            {children}
        </NextThemesProvider>
    )
}
