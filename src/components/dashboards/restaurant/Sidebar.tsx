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

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-2 py-1 sm:px-4 sm:py-2 lg:static lg:h-screen lg:w-20 xl:w-64 lg:flex-col lg:justify-start lg:border-r lg:border-t-0 lg:p-4 transition-all duration-300">

            {/* Logo area - Desktop only */}
            <div className="hidden lg:flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                    <Receipt className="text-white h-5 w-5" />
                </div>
                <div className="hidden xl:block">
                    <h1 className="font-bold text-xl text-slate-800 dark:text-white">RestoHub</h1>
                    <p className="text-xs text-slate-500">Admin Portal</p>
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex flex-row lg:flex-col w-full lg:w-auto justify-around lg:justify-start lg:gap-1 overflow-x-auto">

                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 ${activeTab === 'dashboard'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <LayoutDashboard className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.dashboard}</span>
                </button>

                <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 ${activeTab === 'orders'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Receipt className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.orders}</span>
                </button>

                <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 ${activeTab === 'menu'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <UtensilsCrossed className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.menu}</span>
                </button>

                <button
                    onClick={() => setActiveTab('payments')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 ${activeTab === 'payments'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Wallet className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.payments}</span>
                </button>

                {/* Items hidden on very small screens, visible on sm+ */}
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`hidden sm:flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 ${activeTab === 'categories'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Package className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.categories}</span>
                </button>

                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`hidden sm:flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 ${activeTab === 'analytics'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Package className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.analytics}</span>
                </button>

                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 ${activeTab === 'settings'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Settings className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.settings}</span>
                </button>

                <button
                    onClick={() => setActiveTab('staff')}
                    className={`hidden sm:flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 ${activeTab === 'staff'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <UserIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">Staff</span>
                </button>
            </div>

            {/* Bottom Actions */}
            <div className="hidden lg:flex flex-col items-center gap-3 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 w-full">
                {/* Theme & Language */}
                <div className="flex items-center gap-2 xl:gap-3 justify-center w-full">
                    <button
                        className="p-2 text-slate-400 hover:text-yellow-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                    {onToggleLanguage && (
                        <button
                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors font-bold text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={onToggleLanguage}
                            title="Toggle Language"
                        >
                            {language === 'en' ? 'ID' : 'EN'}
                        </button>
                    )}
                </div>

                {/* Profile */}
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl w-full">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="hidden xl:flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold truncate">{user?.name || 'Admin'}</span>
                        <span className="text-xs text-slate-500 truncate">{user?.role || 'Role'}</span>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium border border-red-100 dark:border-red-900/20 w-full"
                    title="Logout"
                >
                    <LogOut className="h-4 w-4 xl:mr-2" />
                    <span className="hidden xl:inline">{t?.logout || 'Logout'}</span>
                </button>
            </div>

            {/* Mobile bottom action buttons (Theme & Logout only) */}
            <div className="flex lg:hidden items-center gap-1 shrink-0 ml-1">
                <button
                    className="p-2 text-slate-400 hover:text-yellow-500 transition-colors"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                {onToggleLanguage && (
                    <button
                        className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors font-bold text-[10px]"
                        onClick={onToggleLanguage}
                        title="Toggle Language"
                    >
                        {language === 'en' ? 'ID' : 'EN'}
                    </button>
                )}
                <button
                    onClick={onLogout}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                    title="Logout"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </nav>
    )
}
