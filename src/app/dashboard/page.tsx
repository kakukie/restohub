'use client'

import { useEffect, useState } from 'react'
import RestaurantAdminDashboard from '@/components/dashboards/RestaurantAdminDashboard'
import { useAppStore } from '@/store/app-store'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const { user, isInitialized } = useAppStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && isInitialized && (!user || user.role !== 'RESTAURANT_ADMIN')) {
            // Allow Customer role if needed, or redirect them elsewhere
            if (user?.role === 'CUSTOMER') {
                router.push('/')
            } else {
                router.push('/')
            }
        }
    }, [user, isInitialized, mounted, router])

    if (!mounted || !isInitialized || !user || user.role !== 'RESTAURANT_ADMIN') {
        return <div className="flex h-screen items-center justify-center">Loading Dashboard...</div>
    }

    return <RestaurantAdminDashboard />
}
