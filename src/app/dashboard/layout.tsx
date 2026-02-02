'use client'

import { ThemeProvider } from '@/components/theme-provider'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            {children}
        </ThemeProvider>
    )
}
