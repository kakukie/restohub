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
    UtensilsCrossed,
    User as UserIcon
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
        { id: 'analytics', icon: Wallet, label: 'Analytics' },
        { id: 'payments', icon: Receipt, label: 'Payments' }, // Added Payments tab
        { id: 'settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <nav className="fixed bottom-0 left-0 w-full lg:top-0 lg:left-0 lg:w-24 lg:h-full bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800 z-50 transition-colors duration-300">

            {/* Logo (Desktop Only) */}
            <div className="hidden lg:flex items-center justify-center py-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <UtensilsCrossed className="h-6 w-6" />
                </div>
            </div>

            {/* Navigation Links - Horizontal on Mobile, Vertical on Desktop */}
            <div className="flex lg:flex-col items-center justify-around lg:justify-start w-full h-full lg:flex-1 px-2 py-2 lg:py-0 lg:px-0 overflow-x-auto lg:overflow-x-visible">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[60px] lg:min-w-0 ${activeTab === 'dashboard'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <LayoutDashboard className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[10px] lg:text-xs mt-1 font-medium">{t.dashboard}</span>
                </button>

                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[60px] lg:min-w-0 ${activeTab === 'orders'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Receipt className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[10px] lg:text-xs mt-1 font-medium">{t.orders}</span>
                </button>

                <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[60px] lg:min-w-0 ${activeTab === 'menu'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <UtensilsCrossed className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[10px] lg:text-xs mt-1 font-medium">{t.menu}</span>
                </button>

                <button
                    onClick={() => setActiveTab('payments')}
                    className={`flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[60px] lg:min-w-0 ${activeTab === 'payments'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Wallet className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[10px] lg:text-xs mt-1 font-medium">{t.payments}</span>
                </button>

                {/* Hide less important items on mobile to save space */}
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`hidden sm:flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[60px] lg:min-w-0 ${activeTab === 'analytics'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Package className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[10px] lg:text-xs mt-1 font-medium">Analytics</span>
                </button>

                <button
                    onClick={() => setActiveTab('categories')}
                    className={`hidden sm:flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[60px] lg:min-w-0 ${activeTab === 'categories'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Package className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[10px] lg:text-xs mt-1 font-medium">{t.categories}</span>
                </button>

                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[60px] lg:min-w-0 ${activeTab === 'settings'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Settings className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[10px] lg:text-xs mt-1 font-medium">{t.settings}</span>
                </button>

                <button
                    onClick={() => setActiveTab('staff')}
                    className={`hidden sm:flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[60px] lg:min-w-0 ${activeTab === 'staff'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <UserIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[10px] lg:text-xs mt-1 font-medium">Staff</span>
                </button>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-row lg:flex-col items-center justify-around lg:justify-center gap-2 lg:gap-6 mt-2 lg:mt-auto pt-2 lg:pt-0 border-t border-slate-200 dark:border-slate-800 lg:border-t-0 w-full px-2 lg:px-0">
                <div className="flex gap-2 lg:flex-col items-center">
                    <button
                        className="p-2 lg:p-3 text-slate-400 hover:text-yellow-500 transition-colors"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5 lg:h-6 lg:w-6" /> : <Moon className="h-5 w-5 lg:h-6 lg:w-6" />}
                    </button>
                    {onToggleLanguage && (
                        <button
                            className="p-2 lg:p-3 text-slate-400 hover:text-emerald-500 transition-colors font-bold text-xs"
                            onClick={onToggleLanguage}
                            title="Toggle Language"
                        >
                            {language === 'en' ? 'ID' : 'EN'}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 lg:flex-col lg:gap-2 relative w-full lg:w-auto justify-center">
                    {/* Profile Info */}
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-colors shrink-0 flex items-center justify-center bg-emerald-100 text-emerald-600 font-bold text-xs lg:text-sm">
                        {user?.name?.charAt(0) || 'A'}
                    </div>

                    <div className="hidden lg:flex flex-col text-center">
                        <span className="text-sm font-semibold truncate max-w-[100px]">{user?.name || 'Admin'}</span>
                        <span className="text-xs text-slate-500 truncate max-w-[100px]">{user?.role || 'Role'}</span>
                    </div>

                    <button
                        onClick={onLogout}
                        className="flex items-center justify-center p-2 lg:py-2 lg:px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium border border-transparent lg:border-red-100 dark:lg:border-red-900/20 w-auto lg:w-full lg:mt-2"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5 lg:h-4 lg:w-4" />
                        <span className="hidden xl:inline ml-2">{t?.logout || 'Logout'}</span>
                    </button>
                </div>
            </div>
        </nav>
    )
}
