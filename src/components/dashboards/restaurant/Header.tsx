'use client'

import { QrCode, Plus } from 'lucide-react'

interface HeaderProps {
    restaurantName: string
    userName: string
    onShowQR: () => void
    onAddItem: () => void
}

export default function Header({ restaurantName, userName, onShowQR, onAddItem }: HeaderProps) {
    return (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-display">
                    {restaurantName || 'Restaurant'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Welcome back, {userName || 'Admin'}. Here's your shop performance.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onShowQR}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200"
                >
                    <QrCode className="h-5 w-5 text-emerald-500" />
                    <span>Store QR</span>
                </button>

                <button
                    onClick={onAddItem}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-105 transition-all"
                >
                    <Plus className="h-5 w-5" />
                    <span>New Item</span>
                </button>
            </div>
        </header>
    )
}
