'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { toast } from '@/hooks/use-toast'

const SECTIONS = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'admin', label: 'Admin Restoran', icon: 'admin_panel_settings' },
    { id: 'menu', label: 'Menu Digital', icon: 'qr_code_2' },
    { id: 'orders', label: 'Kelola Pesanan', icon: 'receipt_long' },
    { id: 'reports', label: 'Laporan', icon: 'bar_chart' },
    { id: 'customer', label: 'Tampilan Pelanggan', icon: 'person' },
]

const ADMIN_FEATURES = [
    {
        icon: 'dashboard',
        title: 'Dashboard Utama',
        desc: 'Pantau ringkasan pendapatan, jumlah pesanan hari ini, menu terlaris, dan metode pembayaran populer secara real-time.',
        steps: ['Login dengan kredensial demo', 'Klik menu Dashboard di sidebar kiri', 'Lihat statistik: Total Revenue, Total Orders, Avg Order Value', 'Scroll ke bawah untuk melihat grafik & top menu items'],
        color: 'emerald',
        badge: 'Real-time'
    },
    {
        icon: 'restaurant_menu',
        title: 'Manajemen Menu',
        desc: 'Tambah, edit, hapus, dan atur urutan menu. Set badge Bestseller atau Recommended untuk meningkatkan penjualan.',
        steps: ['Pilih menu "Menu" di sidebar', 'Klik "+ New Item" untuk tambah menu baru', 'Isi nama, harga, deskripsi, pilih kategori', 'Toggle "Bestseller" / "Recommended" sesuai kebutuhan', 'Klik Save — perubahan langsung tampil di QR Menu'],
        color: 'blue',
        badge: 'Live Update'
    },
    {
        icon: 'category',
        title: 'Kategori Menu',
        desc: 'Buat kategori untuk mengelompokkan menu. Atur urutan tampil dengan drag & drop.',
        steps: ['Pilih menu "Categories" di sidebar', 'Klik "+ Add Category"', 'Beri nama kategori (contoh: Makanan Utama, Minuman)', 'Gunakan drag handle ⋮⋮ untuk atur urutan', 'Kategori otomatis muncul di menu digital pelanggan'],
        color: 'purple',
        badge: 'Drag & Drop'
    },
    {
        icon: 'receipt_long',
        title: 'Kelola Pesanan',
        desc: 'Monitor semua pesanan masuk, ubah status, dan filter berdasarkan status atau metode pembayaran.',
        steps: ['Pilih menu "Orders" di sidebar', 'Filter pesanan: pilih status (PENDING, CONFIRMED, dll)', 'Filter juga berdasarkan metode pembayaran', 'Klik pesanan untuk lihat detail item', 'Update status: PENDING → CONFIRMED → PREPARING → READY → COMPLETED'],
        color: 'orange',
        badge: 'Auto Refresh'
    },
    {
        icon: 'payments',
        title: 'Metode Pembayaran',
        desc: 'Aktifkan atau nonaktifkan metode pembayaran: CASH, QRIS, GoPay, OVO, DANA, ShopeePay.',
        steps: ['Pilih menu "Settings" di sidebar', 'Scroll ke bagian Payment Methods', 'Toggle ON/OFF metode yang ingin diterima', 'Metode aktif akan muncul sebagai pilihan di menu pelanggan'],
        color: 'teal',
        badge: 'Multi Payment'
    },
    {
        icon: 'bar_chart',
        title: 'Laporan & Analitik',
        desc: 'Analisis performa restoran dengan grafik pendapatan harian, menu terlaris, dan distribusi metode pembayaran.',
        steps: ['Pilih menu "Report" di sidebar', 'Pilih granularitas: Harian, Bulanan, atau Tahunan', 'Atur rentang tanggal filter', 'Lihat grafik pendapatan dan jumlah pesanan', 'Klik "Export CSV" untuk download laporan'],
        color: 'indigo',
        badge: 'Export CSV'
    },
]

const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
}
const badgeColorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
}

export default function DemoGuidePage() {
    const [activeSection, setActiveSection] = useState('overview')
    const [loadingDemo, setLoadingDemo] = useState(false)
    const { setUser } = useAppStore()
    const router = useRouter()

    const handleDemoLogin = async () => {
        setLoadingDemo(true)
        try {
            const res = await fetch('/api/auth/demo', { method: 'POST' })
            const data = await res.json()
            if (res.ok && data.success) {
                setUser(data.user)
                toast({ title: '🎉 Demo Aktif!', description: 'Selamat datang di Warung Nusantara Demo.' })
                router.push('/dashboard')
            } else {
                toast({ title: 'Gagal', description: data.error || 'Coba lagi.', variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Error', description: 'Periksa koneksi internet Anda.', variant: 'destructive' })
        } finally {
            setLoadingDemo(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100">
            {/* ── Header ── */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-slate-400 hover:text-[#00a669] transition-colors">
                            <span className="material-symbols-rounded">home</span>
                        </Link>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Panduan Demo</span>
                    </div>
                    <button
                        onClick={handleDemoLogin}
                        disabled={loadingDemo}
                        className="bg-[#00a669] hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-60">
                        <span className="material-symbols-rounded text-[18px]">
                            {loadingDemo ? 'hourglass_top' : 'play_circle'}
                        </span>
                        {loadingDemo ? 'Memuat...' : 'Coba Demo Sekarang'}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="flex gap-8">
                    {/* ── Sidebar Nav ── */}
                    <div className="hidden lg:block w-52 shrink-0">
                        <div className="sticky top-24 space-y-1">
                            {SECTIONS.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === s.id
                                        ? 'bg-[#00a669] text-white shadow-lg shadow-[#00a669]/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}>
                                    <span className="material-symbols-rounded text-[18px]">{s.icon}</span>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Main Content ── */}
                    <div className="flex-1 min-w-0 space-y-8">

                        {/* Overview */}
                        <div id="overview">
                            {/* Hero */}
                            <div className="bg-gradient-to-br from-[#00a669] to-emerald-700 rounded-3xl p-8 text-white mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="bg-white/20 p-2 rounded-xl">
                                        <span className="material-symbols-rounded text-3xl">science</span>
                                    </span>
                                    <div>
                                        <p className="text-emerald-200 text-sm font-semibold uppercase tracking-widest">Demo Account</p>
                                        <h1 className="text-2xl font-extrabold">Warung Nusantara</h1>
                                    </div>
                                </div>
                                <p className="text-emerald-100 mb-6">
                                    Akun demo dengan data restoran fiktif lengkap: 26 menu items, 5 kategori, 6 metode pembayaran, dan ~79 riwayat pesanan selama 30 hari terakhir.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                    {[
                                        { label: 'Menu Items', value: '26', icon: 'restaurant_menu' },
                                        { label: 'Kategori', value: '5', icon: 'category' },
                                        { label: 'Pembayaran', value: '6', icon: 'payments' },
                                        { label: 'Sample Orders', value: '79', icon: 'receipt_long' },
                                    ].map(stat => (
                                        <div key={stat.label} className="bg-white/10 rounded-2xl p-3 text-center">
                                            <span className="material-symbols-rounded text-2xl text-white/80">{stat.icon}</span>
                                            <div className="text-2xl font-extrabold">{stat.value}</div>
                                            <div className="text-xs text-emerald-200">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={handleDemoLogin}
                                        disabled={loadingDemo}
                                        className="bg-white text-[#00a669] font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-2 disabled:opacity-60">
                                        <span className="material-symbols-rounded">play_circle</span>
                                        {loadingDemo ? 'Memuat...' : 'Masuk Demo Sekarang'}
                                    </button>
                                    <Link href="/login"
                                        className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2 border border-white/20">
                                        <span className="material-symbols-rounded">login</span>
                                        Login Manual
                                    </Link>
                                </div>
                            </div>

                            {/* Credentials Card */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[#00a669]">key</span>
                                    Kredensial Login Demo
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        { label: 'Email', value: 'demo@restohub.id', icon: 'mail' },
                                        { label: 'Password', value: 'demo1234', icon: 'lock' },
                                        { label: 'Role', value: 'Restaurant Admin', icon: 'admin_panel_settings' },
                                        { label: 'Menu URL', value: '/menu/warung-nusantara-demo', icon: 'qr_code_2' },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                            <span className="material-symbols-rounded text-[#00a669]">{item.icon}</span>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                                                <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 mt-3">
                                    ⚠️ Akun demo dibagikan ke publik. Data dapat berubah sewaktu-waktu.
                                </p>
                            </div>

                            {/* Quick Start */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[#00a669]">rocket_launch</span>
                                    Quick Start — 3 Langkah
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { step: '1', title: 'Klik "Masuk Demo Sekarang"', desc: 'Di halaman ini atau landing page, tombol tersebut akan login otomatis.', done: true },
                                        { step: '2', title: 'Explore Dashboard Admin', desc: 'Lihat statistik, kelola menu, pantau pesanan, dan cek laporan.', done: false },
                                        { step: '3', title: 'Scan QR untuk Tampilan Pelanggan', desc: 'Buka /menu/warung-nusantara-demo untuk melihat tampilan yang dilihat pelanggan.', done: false },
                                    ].map(item => (
                                        <div key={item.step} className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-full bg-[#00a669] text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                {item.step}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Admin Features */}
                        <div id="admin">
                            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                                <span className="material-symbols-rounded text-[#00a669]">admin_panel_settings</span>
                                Fitur Dashboard Admin Restoran
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-5">
                                {ADMIN_FEATURES.map(feat => (
                                    <div key={feat.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorMap[feat.color]}`}>
                                                <span className="material-symbols-rounded text-2xl">{feat.icon}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${badgeColorMap[feat.color]}`}>
                                                {feat.badge}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-base mb-1 text-slate-800 dark:text-slate-200">{feat.title}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{feat.desc}</p>
                                        <details className="group">
                                            <summary className="cursor-pointer text-xs font-semibold text-[#00a669] flex items-center gap-1 select-none">
                                                <span className="material-symbols-rounded text-[16px] group-open:rotate-90 transition-transform">chevron_right</span>
                                                Langkah-langkah
                                            </summary>
                                            <ol className="mt-3 space-y-1.5 pl-4">
                                                {feat.steps.map((step, i) => (
                                                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-2">
                                                        <span className="text-[#00a669] font-bold shrink-0">{i + 1}.</span>
                                                        {step}
                                                    </li>
                                                ))}
                                            </ol>
                                        </details>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Customer View */}
                        <div id="customer">
                            <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                                <span className="material-symbols-rounded text-[#00a669]">person</span>
                                Tampilan Pelanggan (Digital Menu)
                            </h2>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                                <p className="text-slate-600 dark:text-slate-400 mb-5">
                                    Pelanggan mengakses menu digital via QR Code. Tidak perlu download aplikasi — langsung di browser.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        { icon: 'qr_code_2', title: 'Scan QR Code', desc: 'Pelanggan scan QR di meja, langsung ke halaman menu.' },
                                        { icon: 'restaurant_menu', title: 'Browse Menu', desc: 'Lihat menu berdasarkan kategori, filter Bestseller & Recommended.' },
                                        { icon: 'shopping_cart', title: 'Tambah ke Keranjang', desc: 'Pilih menu dan jumlah, lanjut ke checkout.' },
                                        { icon: 'payments', title: 'Pilih Pembayaran', desc: 'Pilih metode: CASH, QRIS, GoPay, OVO, DANA, atau ShopeePay.' },
                                        { icon: 'check_circle', title: 'Konfirmasi Pesanan', desc: 'Pesanan masuk otomatis ke dashboard admin untuk diproses.' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                                                <span className="material-symbols-rounded text-[#00a669]">{item.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">🌐 URL Digital Menu Demo:</p>
                                    <Link href="/menu/warung-nusantara-demo"
                                        className="font-mono text-[#00a669] hover:underline text-sm" target="_blank">
                                        /menu/warung-nusantara-demo ↗
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* CTA Bottom */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white text-center">
                            <h3 className="text-2xl font-extrabold mb-2">Siap Mendaftar?</h3>
                            <p className="text-slate-400 mb-6">Mulai uji coba gratis 14 hari. Tidak perlu kartu kredit.</p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <Link href="/register"
                                    className="bg-[#00a669] text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-600 transition-all">
                                    Daftar Restoran Gratis
                                </Link>
                                <button
                                    onClick={handleDemoLogin}
                                    disabled={loadingDemo}
                                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl border border-white/20 transition-all disabled:opacity-60">
                                    {loadingDemo ? 'Memuat...' : 'Coba Demo Dulu'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
