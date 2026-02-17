'use client'

import {
    LayoutDashboard,
    Receipt,
    Package,
    Wallet,
    Settings,
    Moon,
    Sun,
    LogOut,
    UtensilsCrossed
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'

interface SidebarProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    user: any
    onLogout: () => void
    language?: 'en' | 'id'
    onToggleLanguage?: () => void
}

const translations = {
    en: {
        dashboard: "Dashboard",
        menu: "Menu",
        orders: "Orders",
        categories: "Categories",
        settings: "Settings",
        analytics: "Analytics",
        payments: "Payments",
        logout: "Logout"
    },
    id: {
        dashboard: "Dasbor",
        menu: "Menu",
        orders: "Pesanan",
        categories: "Kategori",
        settings: "Pengaturan",
        analytics: "Analitik",
        payments: "Pembayaran",
        logout: "Keluar"
    }
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, language = 'en', onToggleLanguage }: SidebarProps) {
    const t = translations[language]
    const { theme, setTheme } = useTheme()

    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'orders', icon: Receipt, label: 'Orders' },
        { id: 'menu', icon: Package, label: 'Menu' },
        { id: 'categories', icon: UtensilsCrossed, label: 'Categories' }, // Added explicit Category tab
        { id: 'analytics', icon: Wallet, label: 'Finance' }, // Mapped 'payments' to Analytics/Finance
        { id: 'settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <nav className="fixed bottom-0 left-0 w-full lg:top-0 lg:left-0 lg:w-24 lg:h-full bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800 z-50 flex lg:flex-col items-center justify-between p-4 transition-colors duration-300">

            {/* Logo (Desktop Only) */}
            <div className="hidden lg:flex items-center justify-center mb-8">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <UtensilsCrossed className="h-6 w-6" />
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex lg:flex-col gap-2 lg:gap-4 items-center w-full justify-around lg:justify-center">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id
                    const Icon = item.icon

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`p-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            title={item.label}
                        >
                            <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />

                            {/* Tooltip for Desktop */}
                            <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block pointer-events-none z-50">
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Bottom Actions (Desktop Only) */}
            <div className="hidden lg:flex flex-col items-center gap-6 mt-auto">
                <button
                    className="p-3 text-slate-400 hover:text-yellow-500 transition-colors"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                    {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </button>

                <div className="relative group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-colors">
                        {/* Placeholder Avatar if no image */}
                        <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-bold">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="absolute left-12 top-0 bg-red-50 text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-100 whitespace-nowrap flex items-center gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="text-xs font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    )
}
