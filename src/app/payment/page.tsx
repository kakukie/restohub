'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAppStore } from '@/store/app-store'
import { toast } from '@/hooks/use-toast'

interface SystemSettings {
    bankName?: string
    bankAccountNumber?: string
    bankAccountName?: string
    qrisImageUrl?: string
    platformName?: string
}

type PaymentMethod = 'BANK_TRANSFER' | 'QRIS'

function PaymentContent() {
    const searchParams = useSearchParams()
    const { helpdeskSettings } = useAppStore()
    const restaurantId = searchParams.get('restaurantId') || ''
    const plan = searchParams.get('plan') || 'BUSINESS'
    const cycle = searchParams.get('cycle') || '1'

    const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER')
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [proofPreview, setProofPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [amount, setAmount] = useState<number>(0)
    const [settings, setSettings] = useState<SystemSettings>({})
    const [settingsLoading, setSettingsLoading] = useState(true)
    const [paymentId, setPaymentId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const platformName = helpdeskSettings?.platformName || settings.platformName || 'Meenuin'

    // Fetch system settings (bank info, QRIS image)
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings')
                const data = await res.json()
                if (data.success && data.data) {
                    const s = data.data
                    setSettings({
                        bankName: s.bankName || '',
                        bankAccountNumber: s.bankAccountNumber || '',
                        bankAccountName: s.bankAccountName || '',
                        qrisImageUrl: s.qrisImageUrl || '',
                        platformName: s.platformName || 'Meenuin',
                    })
                }
            } catch { /* use defaults */ }
            finally { setSettingsLoading(false) }
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

    // Check existing payment status
    useEffect(() => {
        if (!restaurantId) return
        fetch(`/api/subscription-payment?restaurantId=${restaurantId}`)
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data) {
                    if (data.data.status === 'PENDING') setSubmitted(true)
                    if (data.data.id) setPaymentId(data.data.id)
                }
            })
            .catch(() => { })
    }, [restaurantId])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: 'File terlalu besar', description: 'Maksimal 5MB', variant: 'destructive' })
            return
        }
        setProofFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setProofPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!restaurantId) {
            toast({ title: 'Error', description: 'Restaurant ID tidak ditemukan', variant: 'destructive' })
            return
        }
        if (!proofFile && method !== 'QRIS') {
            toast({ title: 'Bukti Bayar', description: 'Upload bukti transfer terlebih dahulu', variant: 'destructive' })
            return
        }

        setLoading(true)
        try {
            // Convert proof to base64 data URL for storage
            let proofImageUrl: string | null = null
            if (proofFile) {
                proofImageUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(proofFile)
                })
            }

            const response = await fetch('/api/subscription-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId,
                    planName: `${plan} (${cycle} Bulan)`, // Save plan name with its cycle
                    amount,
                    method,
                    proofImageUrl,
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Gagal mengirim pembayaran')

            setPaymentId(data.data?.id)
            setSubmitted(true)
            toast({ title: 'Berhasil! 🎉', description: 'Bukti pembayaran terkirim. Kami akan verifikasi dalam 1x24 jam.' })
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const formatRupiah = (n: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

    return (
        <div className="min-h-screen bg-[#f4fdf9] dark:bg-[#0f172a]">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-green-100 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-[#00a669] p-1.5 rounded-lg">
                            <span className="material-symbols-rounded text-white text-xl">restaurant</span>
                        </div>
                        <span className="text-xl font-extrabold text-[#064e3b] dark:text-white">{platformName}</span>
                    </Link>
                    <span className="text-sm text-slate-500 dark:text-slate-400">Pembayaran Subscription</span>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold text-[#064e3b] dark:text-white">Selesaikan Pembayaran</h1>
                    <p className="text-slate-500 dark:text-slate-400">Paket <strong className="text-[#00a669]">{plan}</strong> • {amount > 0 ? formatRupiah(amount) + '/bulan' : 'Memuat...'}</p>
                </div>

                {/* Success State */}
                {submitted ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 border border-green-100 dark:border-slate-700 shadow-xl text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                            <span className="material-symbols-rounded text-[#00a669] text-4xl">check_circle</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[#064e3b] dark:text-white mb-2">Pembayaran Diterima!</h2>
                            <p className="text-slate-500 dark:text-slate-400">Tim kami akan memverifikasi pembayaran Anda dalam <strong>1×24 jam kerja</strong>. Setelah terverifikasi, akun Anda akan aktif dan notifikasi dikirim ke email Anda.</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <p className="text-sm text-amber-700 dark:text-amber-400">⏳ Status: <strong>Menunggu Verifikasi</strong></p>
                        </div>
                        <Link href="/login" className="inline-block bg-[#00a669] text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all">
                            Ke Halaman Login
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Method Selector */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">Pilih Metode Pembayaran</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {(['BANK_TRANSFER', 'QRIS'] as PaymentMethod[]).map(m => (
                                    <button key={m} type="button" onClick={() => setMethod(m)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all font-semibold text-sm
                                        ${method === m
                                                ? 'border-[#00a669] bg-green-50 dark:bg-green-900/20 text-[#00a669]'
                                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                                        <span className="material-symbols-rounded text-2xl">
                                            {m === 'BANK_TRANSFER' ? 'account_balance' : 'qr_code_2'}
                                        </span>
                                        {m === 'BANK_TRANSFER' ? 'Transfer Bank' : 'QRIS'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Bank Transfer Details */}
                            {method === 'BANK_TRANSFER' && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <span className="material-symbols-rounded text-[#00a669]">account_balance</span>
                                        Info Transfer Bank
                                    </h3>
                                    {settingsLoading ? (
                                        <div className="animate-pulse space-y-2">
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">Bank</span>
                                                <span className="font-bold text-slate-800 dark:text-white">{settings.bankName || 'BCA'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">Nomor Rekening</span>
                                                <span className="font-bold text-[#00a669] text-lg tracking-widest">{settings.bankAccountNumber || '—'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">Atas Nama</span>
                                                <span className="font-bold text-slate-800 dark:text-white">{settings.bankAccountName || '—'}</span>
                                            </div>
                                            <div className="border-t border-green-100 dark:border-green-800 pt-3 flex justify-between items-center">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">Total Transfer</span>
                                                <span className="font-extrabold text-[#00a669] text-xl">{amount > 0 ? formatRupiah(amount) : '—'}</span>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        ⚠️ Pastikan nominal transfer <strong>tepat</strong> sesuai jumlah di atas agar verifikasi lebih cepat.
                                    </p>

                                    {/* Proof Upload */}
                                    <div className="space-y-2 pt-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upload Bukti Transfer</label>
                                        <div onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[#00a669] rounded-xl p-6 text-center cursor-pointer transition-all">
                                            {proofPreview ? (
                                                <img src={proofPreview} alt="Bukti Transfer" className="max-h-48 mx-auto rounded-lg object-contain" />
                                            ) : (
                                                <div className="space-y-2">
                                                    <span className="material-symbols-rounded text-4xl text-slate-400">upload_file</span>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Klik atau drag & drop bukti transfer<br /><span className="text-xs">JPG, PNG, PDF (max 5MB)</span></p>
                                                </div>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                                        {proofFile && (
                                            <p className="text-xs text-green-600 dark:text-green-400">✓ {proofFile.name}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* QRIS */}
                            {method === 'QRIS' && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <span className="material-symbols-rounded text-[#00a669]">qr_code_2</span>
                                        Bayar via QRIS
                                    </h3>
                                    {settingsLoading ? (
                                        <div className="w-48 h-48 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl mx-auto"></div>
                                    ) : settings.qrisImageUrl ? (
                                        <div className="text-center space-y-3">
                                            <img src={settings.qrisImageUrl} alt="QRIS" className="w-56 h-56 mx-auto object-contain border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Scan QR menggunakan aplikasi e-wallet atau mobile banking apapun yang mendukung QRIS.</p>
                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                                                <p className="font-extrabold text-[#00a669] text-xl">Total: {amount > 0 ? formatRupiah(amount) : '—'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 space-y-2">
                                            <span className="material-symbols-rounded text-4xl text-slate-300">qr_code_scanner</span>
                                            <p className="text-sm text-slate-400">QRIS belum dikonfigurasi oleh admin.</p>
                                            <p className="text-xs text-slate-400">Silakan pilih Transfer Bank atau hubungi support.</p>
                                        </div>
                                    )}

                                    {/* Upload Proof for QRIS */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upload Bukti Pembayaran QRIS</label>
                                        <div onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[#00a669] rounded-xl p-6 text-center cursor-pointer transition-all">
                                            {proofPreview ? (
                                                <img src={proofPreview} alt="Bukti QRIS" className="max-h-48 mx-auto rounded-lg object-contain" />
                                            ) : (
                                                <div className="space-y-2">
                                                    <span className="material-symbols-rounded text-4xl text-slate-400">upload_file</span>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">Upload screenshot bukti pembayaran<br /><span className="text-xs">JPG, PNG (max 5MB)</span></p>
                                                </div>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        {proofFile && <p className="text-xs text-green-600 dark:text-green-400">✓ {proofFile.name}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3">
                                <span className="material-symbols-rounded text-blue-500 flex-shrink-0">info</span>
                                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <p className="font-semibold">Proses Verifikasi</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                                        <li>Upload bukti pembayaran setelah transfer</li>
                                        <li>Verifikasi oleh tim kami dalam 1×24 jam kerja</li>
                                        <li>Email konfirmasi dikirim ke email terdaftar</li>
                                        <li>Akun otomatis aktif setelah divalidasi</li>
                                    </ul>
                                </div>
                            </div>

                            <button type="submit" disabled={loading || (!proofFile && method === 'BANK_TRANSFER')}
                                className="w-full py-4 bg-[#00a669] text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? (
                                    <><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> Mengirim...</>
                                ) : (
                                    <><span className="material-symbols-rounded">send</span> Kirim Bukti Pembayaran</>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Support Link */}
                <p className="text-center text-sm text-slate-400 dark:text-slate-500">
                    Butuh bantuan?{' '}
                    <a href="https://wa.me/6288294945050" target="_blank" rel="noopener noreferrer"
                        className="text-[#00a669] font-semibold hover:underline">
                        Hubungi Support via WhatsApp
                    </a>
                </p>
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
