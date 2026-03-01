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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface SidebarProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    user: any
    onLogout: () => void
    language?: 'en' | 'id'
    onToggleLanguage?: () => void
    pendingOrderCount?: number
}

const translations = {
    en: {
        dashboard: "Dashboard",
        menu: "Menu",
        orders: "Orders",
        categories: "Categories",
        settings: "Settings",
        analytics: "Report",
        payments: "Payments",
        logout: "Logout"
    },
    id: {
        dashboard: "Dasbor",
        menu: "Menu",
        orders: "Pesanan",
        categories: "Kategori",
        settings: "Pengaturan",
        analytics: "Laporan",
        payments: "Pembayaran",
        logout: "Keluar"
    }
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, language = 'en', onToggleLanguage, pendingOrderCount = 0 }: SidebarProps) {
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
            <div className="flex flex-row lg:flex-col w-full lg:w-auto justify-start lg:gap-1 overflow-x-auto hide-scrollbar">

                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 shrink-0 ${activeTab === 'dashboard'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <LayoutDashboard className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.dashboard}</span>
                </button>

                <button
                    onClick={() => setActiveTab('orders')}
                    className={`relative flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 shrink-0 ${activeTab === 'orders'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Receipt className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.orders}</span>
                    {pendingOrderCount > 0 && (
                        <div className="absolute top-1 right-2 lg:top-2 lg:right-6">
                            <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full shadow-md animate-pulse">
                                {pendingOrderCount > 99 ? '99+' : pendingOrderCount}
                            </Badge>
                        </div>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 shrink-0 ${activeTab === 'menu'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <UtensilsCrossed className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.menu}</span>
                </button>

                <button
                    onClick={() => setActiveTab('payments')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 shrink-0 ${activeTab === 'payments'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Wallet className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.payments}</span>
                </button>

                {/* Items hidden previously on very small screens, now visible with shrink-0 */}
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 shrink-0 ${activeTab === 'categories'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Package className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.categories}</span>
                </button>

                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 shrink-0 ${activeTab === 'analytics'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Package className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.analytics}</span>
                </button>

                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 shrink-0 ${activeTab === 'settings'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Settings className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">{t.settings}</span>
                </button>

                <button
                    onClick={() => setActiveTab('staff')}
                    className={`flex flex-col items-center justify-center py-2 px-2 sm:px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[48px] lg:min-w-0 shrink-0 ${activeTab === 'staff'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <UserIcon className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[9px] sm:text-[10px] lg:text-xs mt-1 font-medium">Staff</span>
                </button>
            </div>

            {/* Unified Settings Dropdown (Desktop & Mobile) */}
            <div className="flex lg:flex-col items-center gap-3 lg:mt-auto lg:pt-4 lg:border-t lg:border-slate-200 dark:lg:border-slate-800 lg:w-full shrink-0 ml-1 lg:ml-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="hidden xl:flex flex-col overflow-hidden text-left">
                                <span className="text-sm font-semibold truncate">{user?.name || 'Admin'}</span>
                                <span className="text-xs text-slate-500 truncate">{user?.role || 'Role'}</span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-56 mb-2 lg:mb-0 lg:ml-2">
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1 xl:hidden">
                            <div className="flex flex-col overflow-hidden text-left py-1">
                                <span className="text-sm font-semibold truncate">{user?.name || 'Admin'}</span>
                                <span className="text-xs text-slate-500 truncate">{user?.role || 'Role'}</span>
                            </div>
                        </div>

                        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="cursor-pointer flex items-center justify-between">
                            <div className="flex items-center">
                                {theme === 'dark' ? <Sun className="h-4 w-4 mr-2 text-yellow-500" /> : <Moon className="h-4 w-4 mr-2 text-slate-500" />}
                                <span>Theme</span>
                            </div>
                            <span className="text-xs text-slate-400 capitalize">{theme || 'System'}</span>
                        </DropdownMenuItem>

                        {onToggleLanguage && (
                            <DropdownMenuItem onClick={onToggleLanguage} className="cursor-pointer flex items-center justify-between">
                                <span className="flex items-center h-4 font-medium mr-2 text-slate-500">A文</span>
                                <span>Language</span>
                                <span className="text-xs font-bold text-emerald-500">{language.toUpperCase()}</span>
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

                        <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                            <LogOut className="h-4 w-4 mr-2" />
                            <span>{t?.logout || 'Logout'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}
