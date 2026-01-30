'use client'

import { useEffect, useState } from 'react'
import RestaurantAdminDashboard from '@/components/dashboards/RestaurantAdminDashboard'
import { useAppStore } from '@/store/app-store'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const { user } = useAppStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (mounted && (!user || user.role !== 'RESTAURANT_ADMIN')) {
            // Allow Customer role if needed, or redirect them elsewhere
            if (user?.role === 'CUSTOMER') {
                // Customer dashboard logic is usually separate, but for now redirect home or handle here
                router.push('/')
            } else {
                router.push('/')
            }
        }
    }, [user, mounted, router])

    if (!mounted || !user || user.role !== 'RESTAURANT_ADMIN') {
        return <div className="flex h-screen items-center justify-center">Loading Dashboard...</div>
    }

    return <RestaurantAdminDashboard />
}
