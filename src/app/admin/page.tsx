'use client'

import { useEffect, useState } from 'react'
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard'
import { useAppStore } from '@/store/app-store'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
    const { user, isInitialized } = useAppStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && isInitialized && (!user || user.role !== 'SUPER_ADMIN')) {
            router.push('/')
        }
    }, [user, isInitialized, mounted, router])

    if (!mounted || !isInitialized || !user || user.role !== 'SUPER_ADMIN') {
        return <div className="flex h-screen items-center justify-center">Loading Admin Portal...</div>
    }

    return <SuperAdminDashboard />
}
