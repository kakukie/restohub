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
    User as UserIcon,
    Menu
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
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { useState } from 'react'

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
        logout: "Logout",
        staff: "Staff",
        more: "More"
    },
    id: {
        dashboard: "Dasbor",
        menu: "Menu",
        orders: "Pesanan",
        categories: "Kategori",
        settings: "Pengaturan",
        analytics: "Laporan",
        payments: "Pembayaran",
        logout: "Keluar",
        staff: "Staf",
        more: "Lainnya"
    }
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, language = 'en', onToggleLanguage, pendingOrderCount = 0 }: SidebarProps) {
    const t = translations[language]
    const { theme, setTheme } = useTheme()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const mainNavItems = [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'orders', label: t.orders, icon: Receipt, badge: pendingOrderCount },
        { id: 'menu', label: t.menu, icon: UtensilsCrossed },
        { id: 'payments', label: t.payments, icon: Wallet },
    ]

    const moreNavItems = [
        { id: 'categories', label: t.categories, icon: Package },
        { id: 'analytics', label: t.analytics, icon: Package },
        { id: 'settings', label: t.settings, icon: Settings },
        { id: 'staff', label: t.staff, icon: UserIcon },
    ]

    const NavItem = ({ item, isMobile = false }: { item: any, isMobile?: boolean }) => {
        const Icon = item.icon
        const isActive = activeTab === item.id

        return (
            <button
                onClick={() => {
                    setActiveTab(item.id)
                    if (isMobile) setIsMobileMenuOpen(false)
                }}
                className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start py-2 px-1 sm:px-2 lg:py-3 lg:px-4 w-full rounded-xl transition-all ${isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    } relative`}
            >
                <div className="relative">
                    <Icon className="h-5 w-5 lg:h-6 lg:w-6 lg:mr-3" />
                    {item.badge > 0 && (
                        <div className="absolute -top-1 -right-2 lg:top-0 lg:-right-3">
                            <Badge variant="destructive" className="h-[18px] w-[18px] flex items-center justify-center p-0 text-[10px] rounded-full shadow-md animate-pulse">
                                {item.badge > 99 ? '99+' : item.badge}
                            </Badge>
                        </div>
                    )}
                </div>
                <span className={`text-[10px] sm:text-[11px] mt-1 lg:mt-0 lg:text-sm font-medium ${isMobile ? 'block' : 'hidden lg:block'}`}>
                    {item.label}
                </span>
            </button>
        )
    }

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 flex flex-col lg:static lg:h-screen lg:w-64 lg:border-r lg:border-t-0 pb-safe lg:pb-0">
            {/* Desktop Logo Area */}
            <div className="hidden lg:flex items-center gap-3 p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <Receipt className="text-white h-6 w-6" />
                </div>
                <div>
                    <h1 className="font-bold text-xl text-slate-900 dark:text-white leading-tight">RestoHub</h1>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium tracking-wide uppercase">Admin Portal</p>
                </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex flex-col gap-2 p-4 flex-grow overflow-y-auto hide-scrollbar">
                {mainNavItems.map(item => <NavItem key={item.id} item={item} />)}
                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
                {moreNavItems.map(item => <NavItem key={item.id} item={item} />)}
            </div>

            {/* Mobile Navigation Bar */}
            <div className="lg:hidden flex justify-around items-end w-full px-1 sm:px-2 py-1 sm:py-2">
                {mainNavItems.map(item => <NavItem key={item.id} item={{ ...item, badge: item.badge > 0 ? item.badge : 0 }} isMobile />)}

                {/* More Sheet Trigger */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <button className="flex flex-col items-center justify-center py-2 px-1 sm:px-2 w-full rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 relative">
                            <Menu className="h-5 w-5" />
                            <span className="text-[10px] sm:text-[11px] mt-1 font-medium">{t.more}</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[auto] max-h-[85vh] rounded-t-3xl border-t border-slate-200 dark:border-slate-800 px-4 pb-8 pt-6">
                        <SheetTitle className="sr-only">{t.more} Navigation</SheetTitle>
                        <SheetHeader className="mb-6 text-left">
                            <div className="text-xl font-bold flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600">
                                    <Menu className="h-5 w-5" />
                                </div>
                                {t.more}
                            </div>
                        </SheetHeader>
                        <div className="grid grid-cols-2 gap-3">
                            {moreNavItems.map(item => {
                                const Icon = item.icon
                                const isActive = activeTab === item.id
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id)
                                            setIsMobileMenuOpen(false)
                                        }}
                                        className={`flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all border ${isActive
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/50'
                                            }`}
                                    >
                                        <Icon className="h-6 w-6 mb-2" />
                                        <span className="text-xs font-semibold">{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Mobile Profile & Settings */}
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors w-full focus:outline-none ring-1 ring-slate-200 dark:ring-slate-700">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                                            {user?.name?.charAt(0) || 'A'}
                                        </div>
                                        <div className="flex flex-col overflow-hidden text-left flex-grow">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role || 'Role'}</span>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" side="top" className="w-[calc(100vw-32px)] mb-2">
                                    <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="cursor-pointer flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                                {theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-500" />}
                                            </div>
                                            <span className="font-medium">Theme</span>
                                        </div>
                                        <span className="text-xs text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{theme || 'System'}</span>
                                    </DropdownMenuItem>

                                    {onToggleLanguage && (
                                        <DropdownMenuItem onClick={onToggleLanguage} className="cursor-pointer flex items-center justify-between py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                                    <span className="font-bold text-xs w-4 text-center">A文</span>
                                                </div>
                                                <span className="font-medium">Language</span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">{language.toUpperCase()}</span>
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuSeparator className="my-1" />

                                    <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 py-3">
                                        <LogOut className="h-4 w-4 mr-3" />
                                        <span className="font-medium">{t?.logout || 'Logout'}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Unified Settings Dropdown (Desktop & Mobile Profile Area) */}
            <div className="hidden lg:block p-4 mt-auto border-t border-slate-100 dark:border-slate-800 shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors w-full focus:outline-none ring-1 ring-slate-200 dark:ring-slate-700">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="flex flex-col overflow-hidden text-left flex-grow">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Admin'}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role || 'Role'}</span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-60 mb-2">
                        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="cursor-pointer flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                    {theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-500" />}
                                </div>
                                <span className="font-medium">Theme</span>
                            </div>
                            <span className="text-xs text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{theme || 'System'}</span>
                        </DropdownMenuItem>

                        {onToggleLanguage && (
                            <DropdownMenuItem onClick={onToggleLanguage} className="cursor-pointer flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                        <span className="font-bold text-xs w-4 text-center">A文</span>
                                    </div>
                                    <span className="font-medium">Language</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">{language.toUpperCase()}</span>
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="my-1" />

                        <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 py-3">
                            <LogOut className="h-4 w-4 mr-3" />
                            <span className="font-medium">{t?.logout || 'Logout'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    )
}
