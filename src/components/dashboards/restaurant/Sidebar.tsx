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
    MoreHorizontal
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
    const t = translations[language] || translations.en
    const { theme, setTheme } = useTheme()

    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'orders', icon: Receipt, label: 'Orders' },
        { id: 'menu', icon: Package, label: 'Menu' },
        { id: 'categories', icon: UtensilsCrossed, label: 'Categories' },
        { id: 'analytics', icon: Wallet, label: 'Analytics' },
        { id: 'payments', icon: Receipt, label: 'Payments' },
        { id: 'staff', icon: UserIcon, label: 'Staff' }
    ]

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 flex justify-between items-center px-4 py-2 lg:static lg:h-screen lg:w-64 lg:flex-col lg:justify-start lg:border-r lg:border-t-0 lg:p-4 transition-all duration-300">

            {/* Logo area - Desktop only */}
            <div className="hidden lg:flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Receipt className="text-white h-5 w-5" />
                </div>
                <div>
                    <h1 className="font-bold text-xl text-slate-800 dark:text-white">RestoHub</h1>
                    <p className="text-xs text-slate-500">Admin Portal</p>
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex flex-row lg:flex-col w-full lg:w-auto justify-around lg:justify-start lg:gap-2 flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start p-2 lg:px-4 lg:py-3 rounded-xl transition-all ${activeTab === item.id
                                ? 'text-emerald-600 dark:text-emerald-400 lg:bg-emerald-50 lg:dark:bg-emerald-900/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500 lg:hover:bg-slate-50 lg:dark:hover:bg-slate-800'
                            }`}
                    >
                        <item.icon className={`h-6 w-6 lg:h-5 lg:w-5 ${activeTab === item.id ? 'fill-current' : ''}`} />
                        <span className="text-[10px] lg:text-sm lg:ml-3 font-medium mt-1 lg:mt-0">
                            {/* Detailed Translation Logic */}
                            {language === 'id' && item.id === 'dashboard' ? 'Dasbor' :
                                language === 'id' && item.id === 'orders' ? 'Pesanan' :
                                    language === 'id' && item.id === 'menu' ? 'Menu' :
                                        language === 'id' && item.id === 'categories' ? 'Kategori' :
                                            language === 'id' && item.id === 'analytics' ? 'Analitik' :
                                                language === 'id' && item.id === 'payments' ? 'Pembayaran' :
                                                    language === 'id' && item.id === 'staff' ? 'Staf' :
                                                        item.label}
                        </span>
                    </button>
                ))}

                {/* Settings Tab - Hidden on mobile bottom bar if space is tight, typically moved to menu */}
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`hidden sm:flex flex-col items-center justify-center py-2 px-3 lg:py-3 lg:px-2 lg:w-full rounded-xl transition-all min-w-[60px] lg:min-w-0 ${activeTab === 'settings'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                >
                    <Settings className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-[10px] lg:text-xs mt-1 font-medium">{t.settings}</span>
                </button>

                {/* Mobile Menu Trigger for Bottom Actions */}
                <div className="lg:hidden flex flex-col items-center justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex flex-col items-center justify-center p-2 text-slate-500 hover:text-emerald-500">
                                <MoreHorizontal className="h-6 w-6" />
                                <span className="text-[10px] font-medium mt-1">Menu</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mb-2">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                <span>{user?.name || 'Admin'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onToggleLanguage}>
                                <span className="font-bold w-4 mr-2 text-center">{language === 'en' ? 'ID' : 'EN'}</span>
                                <span>{language === 'en' ? 'Switch to ID' : 'Switch to EN'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onLogout} className="text-red-500 focus:text-red-500">
                                <LogOut className="h-4 w-4 mr-2" />
                                <span>{t?.logout || 'Logout'}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Desktop Bottom Actions (Profile, Theme, etc) - Visible on Large Screens */}
            <div className="hidden lg:flex flex-col gap-4 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 px-2">

                <div className="flex items-center justify-between">
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

                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold truncate">{user?.name || 'Admin'}</span>
                        <span className="text-xs text-slate-500 truncate">{user?.role || 'Role'}</span>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium border border-red-100 dark:border-red-900/20 w-full"
                    title="Logout"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>{t?.logout || 'Logout'}</span>
                </button>
            </div>
        </nav>
    )
}
