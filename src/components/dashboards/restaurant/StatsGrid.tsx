'use client'

import { ShoppingBag, DollarSign, Utensils, XCircle } from 'lucide-react'

interface StatsGridProps {
    stats: {
        totalOrders: number
        revenue: number
        totalCategories: number
        cancelledOrders: number
    }
}

export default function StatsGrid({ stats }: StatsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Orders */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                        <ShoppingBag className="h-6 w-6" />
                    </div>
                    {/* Mock Trend - In real app, calculate this */}
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        +12.5%
                    </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Orders</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                    {stats.totalOrders?.toLocaleString() || 0}
                </h3>
            </div>

            {/* Revenue */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        +18.2%
                    </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Revenue</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                    Rp {stats.revenue?.toLocaleString('id-ID') || 0}
                </h3>
            </div>

            {/* Categories */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                        <Utensils className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                        Active
                    </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Categories</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                    {stats.totalCategories || 0}
                </h3>
            </div>

            {/* Cancelled */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                        <XCircle className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full">
                        -2.4%
                    </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cancelled</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                    {stats.cancelledOrders || 0}
                </h3>
            </div>
        </div>
    )
}
