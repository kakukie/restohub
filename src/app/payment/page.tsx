'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAppStore } from '@/store/app-store'
import { toast } from '@/hooks/use-toast'

declare global {
    interface Window {
        snap?: any
    }
}

interface SystemSettings {
    platformName?: string
}

function PaymentContent() {
    const searchParams = useSearchParams()
    const { helpdeskSettings } = useAppStore()
    const restaurantId = searchParams.get('restaurantId') || ''
    const plan = searchParams.get('plan') || 'BUSINESS'
    const cycle = searchParams.get('cycle') || '1'

    const [submitted, setSubmitted] = useState(false)
    const [amount, setAmount] = useState<number>(0)
    const [settings, setSettings] = useState<SystemSettings>({})
    const [snapReady, setSnapReady] = useState(false)
    const [midtransLoading, setMidtransLoading] = useState(false)

    const platformName = helpdeskSettings?.platformName || settings.platformName || 'Meenuin'
    const snapClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    const isProdSnap = (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION || '').toString() === 'true'
    const snapUrl = isProdSnap
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js'

    // Fetch system settings needed only for branding
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings')
                const data = await res.json()
                if (data.success && data.data) {
                    const s = data.data
                    setSettings({
                        platformName: s.platformName || 'Meenuin',
                    })
                }
            } catch { /* use defaults */ }
        }

        const fetchPlanPrice = async () => {
            try {
                const res = await fetch('/api/subscription-plans')
                const data = await res.json()
                if (data.success && Array.isArray(data.data)) {
                    const match = data.data.find((p: any) =>
                        p.name?.toUpperCase().replace(/[ -]/g, '_') === plan.toUpperCase().replace(/[ -]/g, '_')
                    )
                    if (match) {
                        // Calculate price based on cycle
                        let cyclePrice = match.price
                        if (cycle === '3') cyclePrice = match.price3Months || (match.price * 3)
                        else if (cycle === '6') cyclePrice = match.price6Months || (match.price * 6)
                        else if (cycle === '12') cyclePrice = match.price12Months || (match.price * 12)

                        setAmount(cyclePrice)
                    }
                }
            } catch { /* ignore */ }
        }

        fetchSettings()
        fetchPlanPrice()
    }, [plan, cycle])

    // Load Midtrans Snap script (client-side only)
    useEffect(() => {
        if (!snapClientKey) return
        const existing = document.querySelector(`script[src*=\"midtrans.com/snap/snap.js\"]`)
        if (existing) {
            setSnapReady(true)
            return
        }
        const script = document.createElement('script')
        script.src = `${snapUrl}?client-key=${snapClientKey}`
        script.dataset.clientKey = snapClientKey
        script.onload = () => setSnapReady(true)
        script.onerror = () => toast({ title: 'Midtrans', description: 'Gagal memuat Snap JS', variant: 'destructive' })
        document.body.appendChild(script)
        return () => {
            script.remove()
        }
    }, [snapClientKey, snapUrl])

    // Check existing payment status
    useEffect(() => {
        if (!restaurantId) return
        fetch(`/api/subscription-payment?restaurantId=${restaurantId}`)
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data) {
                    if (data.data.status === 'PENDING') setSubmitted(true)
                }
            })
            .catch(() => { })
    }, [restaurantId])

    const handleMidtransPay = async () => {
        if (!restaurantId) {
            toast({ title: 'Error', description: 'Restaurant ID tidak ditemukan', variant: 'destructive' })
            return
        }
        if (!snapClientKey) {
            toast({ title: 'Midtrans', description: 'Client key belum diatur', variant: 'destructive' })
            return
        }
        setMidtransLoading(true)
        try {
            const res = await fetch('/api/payment/midtrans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, plan, cycle })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal membuat transaksi')

            const { token, redirectUrl } = data.data || {}

            const onSuccess = () => {
                setSubmitted(true)
                toast({ title: 'Pembayaran berhasil', description: 'Akun akan aktif otomatis setelah konfirmasi Midtrans.' })
            }
            const onPending = () => {
                setSubmitted(true)
                toast({ title: 'Menunggu pembayaran', description: 'Kami menunggu konfirmasi Midtrans.' })
            }
            const onError = (err: any) => {
                console.error(err)
                toast({ title: 'Midtrans error', description: err?.message || 'Gagal memproses pembayaran', variant: 'destructive' })
            }

            if (typeof window !== 'undefined' && window.snap?.pay) {
                window.snap.pay(token, {
                    onSuccess,
                    onPending,
                    onError,
                    onClose: () => toast({ title: 'Pembayaran dibatalkan', description: 'Anda dapat mencoba lagi.' })
                })
            } else if (redirectUrl) {
                window.location.href = redirectUrl
            } else {
                toast({ title: 'Midtrans', description: 'Token diterima tetapi Snap belum siap', variant: 'destructive' })
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        } finally {
            setMidtransLoading(false)
        }
    }

    const formatRupiah = (n: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

    return (
        <div className="min-h-screen bg-[#f4fdf9] dark:bg-[#0f172a] flex flex-col justify-between">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-green-100 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-[#00a669] p-1.5 rounded-lg">
                            <span className="material-symbols-rounded text-white text-xl">restaurant</span>
                        </div>
                        <span className="text-xl font-extrabold text-[#064e3b] dark:text-white">{platformName}</span>
                    </Link>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pembayaran Subscription</span>
                </div>
            </nav>

            <main className="max-w-xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold text-[#064e3b] dark:text-white">Selesaikan Pembayaran</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Aktifkan paket layanan Restoran Anda menggunakan sistem pembayaran otomatis Midtrans.
                    </p>
                </div>

                {/* Success/Pending State */}
                {submitted ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 border border-green-100 dark:border-slate-700 shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto text-amber-500">
                            <span className="material-symbols-rounded text-4xl animate-pulse">hourglass_empty</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-[#064e3b] dark:text-white">Menunggu Pembayaran</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Silakan selesaikan pembayaran Anda sesuai instruksi di jendela Midtrans. Setelah pembayaran dikonfirmasi oleh Midtrans, akun Restoran Anda akan aktif secara otomatis.
                            </p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <p className="text-sm text-amber-700 dark:text-amber-400">⏳ Status: <strong>Menunggu Konfirmasi Midtrans</strong></p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Link href="/login" className="w-full bg-[#00a669] text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-500/20">
                                Ke Halaman Login
                            </Link>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                                Buat Pembayaran Baru
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Plan Summary Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-green-100 dark:border-slate-700 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-800 dark:text-white text-base">Detail Tagihan</h3>
                            <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-700">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Paket Langganan</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{plan}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-3">
                                    <span className="text-slate-500 dark:text-slate-400">Siklus Tagihan</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{cycle} Bulan</span>
                                </div>
                                <div className="flex justify-between items-center pt-3">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Pembayaran</span>
                                    <span className="text-xl font-extrabold text-[#00a669]">
                                        {amount > 0 ? formatRupiah(amount) : 'Memuat...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Midtrans Snap Action Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-green-200 dark:border-green-800 shadow-lg shadow-green-500/5 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-2xl text-[#00a669]">
                                    <span className="material-symbols-rounded text-3xl">bolt</span>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-[#064e3b] dark:text-white text-lg">Pembayaran Otomatis</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Proses instan tanpa verifikasi manual</p>
                                </div>
                            </div>
                            
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Klik tombol di bawah untuk membuka jendela pembayaran Midtrans. Anda dapat membayar menggunakan QRIS, Virtual Account bank transfer, kartu kredit, E-wallet, dll.
                            </p>

                            <button
                                type="button"
                                onClick={handleMidtransPay}
                                disabled={midtransLoading || !snapReady || !snapClientKey}
                                className="w-full py-4 bg-[#00a669] text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                {midtransLoading ? (
                                    <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> Menghubungkan ke Midtrans...</>
                                ) : (
                                    <><span className="material-symbols-rounded">payment</span> Bayar Sekarang</>
                                )}
                            </button>
                            
                            {!snapClientKey && (
                                <p className="text-xs text-amber-600 text-center bg-amber-50 dark:bg-amber-950/20 py-2.5 px-4 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                                    ⚠️ Client key Midtrans belum diisi. Tambahkan di env `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Support Link */}
                <div className="text-center space-y-2">
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                        Butuh bantuan transaksi?{' '}
                        <a href="https://wa.me/6288294945050" target="_blank" rel="noopener noreferrer"
                            className="text-[#00a669] font-semibold hover:underline inline-flex items-center gap-1">
                            Hubungi Support via WhatsApp
                        </a>
                    </p>
                </div>
            </main>
        </div>
    )
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#f4fdf9] dark:bg-[#0f172a]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a669]"></div>
            </div>
        }>
            <PaymentContent />
        </Suspense>
    )
}
