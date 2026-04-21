'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/store/app-store'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'

interface PlanData {
    id: string
    name: string
    price: number
    description: string
    features: string[]
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    const labels = ['Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat']
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']
    return { score, label: labels[score], color: colors[score] }
}

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { helpdeskSettings } = useAppStore()
    const [loading, setLoading] = useState(false)
    const [captchaVerified, setCaptchaVerified] = useState(false)
    const [plans, setPlans] = useState<PlanData[]>([])
    const [plansLoading, setPlansLoading] = useState(true)
    const [showPassword, setShowPassword] = useState(false)

    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        ownerName: '',
        password: '',
        package: 'FREE_TRIAL',
        billingCycle: '1',
        description: '',
        tableCount: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const platformName = helpdeskSettings?.platformName || 'Meenuin'
    const pwStrength = getPasswordStrength(formData.password)

    // Fetch subscription plans & pre-select from URL param
    useEffect(() => {
        const urlPlan = searchParams.get('plan') || searchParams.get('package')
        fetch('/api/subscription-plans')
            .then(r => r.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    const all: PlanData[] = data.data
                    const active = all.filter(p => p.isActive !== false)

                    const isAllowed = (name: string) => {
                        const key = name.toUpperCase()
                        return key.includes('FREE') || key.includes('BUSINESS') || key.includes('BISNIS')
                    }

                    // Pisahkan paket yang diizinkan (Free Trial & Bisnis), lainnya ditandai disabled
                    const allowedPlans = active.filter(p => isAllowed(p.name))
                    const disabledPlans = active.filter(p => !isAllowed(p.name)).map(p => ({ ...p, disabled: true }))

                    // Pastikan Free Trial selalu ada
                    const freePlan: any = allowedPlans.find(p => p.name.toUpperCase().includes('FREE')) || {
                        id: 'FREE_TRIAL_LOCAL',
                        name: 'FREE_TRIAL',
                        price: 0,
                        description: 'Free trial 30 hari',
                        features: []
                    }

                    const merged = [
                        freePlan,
                        ...allowedPlans.filter(p => p.id !== freePlan.id),
                        ...disabledPlans
                    ]

                    setPlans(merged)

                    if (urlPlan) {
                        const key = urlPlan.toUpperCase().replace(/[ -]/g, '_')
                        const match = merged.find((p: PlanData) =>
                            p.name.toUpperCase().replace(/[ -]/g, '_').includes(key) ||
                            key.includes(p.name.toUpperCase().replace(/[ -]/g, '_'))
                        )
                        if (match) setFormData(prev => ({ ...prev, package: match.name }))
                    } else {
                        // default ke Free Trial
                        setFormData(prev => ({ ...prev, package: 'FREE_TRIAL', billingCycle: '1' }))
                    }
                }
            })
            .catch(() => {
                // fallback tetap ada Free Trial
                setPlans([
                    { id: 'FREE_TRIAL_LOCAL', name: 'FREE_TRIAL', price: 0, description: '', features: [] },
                    { id: 'BUSINESS_LOCAL', name: 'BUSINESS', price: 19000, description: '', features: [] },
                ])
            })
            .finally(() => setPlansLoading(false))
    }, [])

    const handleNextStep = () => {
        if (!formData.name || !formData.address || !formData.description || !formData.tableCount) {
            toast({ title: 'Validation Error', description: 'Silakan isi semua data bisnis', variant: 'destructive' })
            return
        }
        setStep(2)
    }

    const handleBackStep = () => { setStep(1) }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!captchaVerified) {
            toast({ title: 'Validation Error', description: 'Centang kotak captcha persetujuan.', variant: 'destructive' })
            return
        }
        if (formData.password.length < 8) {
            toast({ title: 'Password Terlalu Pendek', description: 'Password minimal 8 karakter.', variant: 'destructive' })
            return
        }
        if (pwStrength.score < 2) {
            toast({ title: 'Password Terlalu Lemah', description: 'Gunakan kombinasi huruf besar, angka, dan karakter spesial.', variant: 'destructive' })
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    plan: formData.package,
                    role: 'RESTAURANT_ADMIN',
                    address: formData.address,
                    description: formData.description,
                    tableCount: formData.tableCount,
                    ownerName: formData.ownerName
                })
            })

            const data = await response.json()

            if (!response.ok) throw new Error(data.error || 'Registrasi gagal')

            // If paid plan → redirect to payment page
            // The value of formData.package could be either the original name or the uppercased key based on the previous useEffect
            const selectedPlan = plans.find(p => p.name === formData.package || p.name.toUpperCase().replace(/[ -]/g, '_') === formData.package)

            // Log to debug plan mismatch
            console.log('Selected Plan for Payment Check:', {
                formDataPackage: formData.package,
                foundPlan: selectedPlan,
                price: selectedPlan?.price
            })

            const isFreePlan = (formData.package || '').toUpperCase().includes('FREE')
            // Asumsi: semua paket non-FREE wajib pembayaran, tanpa melihat nilai price
            const needsPayment = !isFreePlan

            toast({
                title: 'Pendaftaran Berhasil! 🎉',
                description: needsPayment
                    ? 'Silakan lanjutkan ke halaman pembayaran.'
                    : 'Akun Free Trial aktif, silakan login untuk mulai mencoba.',
            })

            if (needsPayment && data.data?.restaurant?.id) {
                router.push(`/payment?restaurantId=${data.data.restaurant.id}&plan=${formData.package}&cycle=${formData.billingCycle}`)
            } else {
                router.push('/login')
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Registration failed. Please try again.', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const toggleDarkMode = () => document.documentElement.classList.toggle('dark')

    return (
        <div className="bg-[#f4fdf9] dark:bg-[#0f172a] min-h-screen transition-colors duration-300">
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-green-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image 
                          src="/logo.png?v=3" 
                          alt={platformName} 
                          width={160} 
                          height={50} 
                          className="h-10 w-auto object-contain" 
                          priority
                        />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link className="text-sm font-semibold bg-green-50 dark:bg-slate-800 text-[#00a669] px-5 py-2.5 rounded-full hover:bg-green-100 transition-all" href="/login">Sudah punya akun? Login</Link>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-16">
                <aside className="lg:w-1/3 space-y-12">
                    <div className="space-y-6">
                        <h1 className="text-4xl font-extrabold text-[#064e3b] dark:text-white leading-tight">
                            Mulai Digitalisasi Restoran Anda Hari Ini
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Bergabunglah dengan ribuan pemilik bisnis kuliner yang telah meningkatkan efisiensi operasional dengan {platformName}.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-green-100 dark:border-slate-700 shadow-xl shadow-green-900/5">
                        <div className="flex -space-x-3 mb-6">
                            <img alt="Merchant 1" className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIGToXp7kUAYXGQcb_xGl-ysGYst0wD7y8D85HlTrPwX2IUkgsx20-ghDqLs_hnj0nK-sq9viH3pOs9unz4MpdsM70avM2R3drHa3Bvov6f15Qc4Udn_DaX-EZI95D1-hTxykE0QYJuAmWfbciMAO5UW1HbX7ww6ZYu2hd9Telnr0XJGsaYset4-YEs-UYQRSHmzo2imVIiU8IGdK7Plqzv-Y6xTLi9tDr61cJojT2EoGDIMS8Iu7CEqpC-jTVQuLz83ZbtfgQDoMj" />
                            <img alt="Merchant 2" className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH8zJywtu7DBLfKHq-xgaKgUiaUXZVvj0tFxHgvzU-hUUo1fuCQWlfATIJKoHk5XrKhFUIHPhiL37Iu2ltZYo3BhuUxdOrlfgkKgZxpq71165gOxIhfimR1HGLFrGQ1Kh-VSN0NGz4qEOVc3ku-PEimNa3YUrsZmSpuH9n7HioAtczyMoBkLGbnKTQlfnHgZeb-OgHXDe5d-8yenRoWcx6DATHFkxNeKQlwxzg71Q_Reyn_xx1sI4VAWh4s2tne-e65XXBNV-S_W0Z" />
                            <img alt="Merchant 3" className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3-drkNstTzbF4bpB4D4Ha93Kdm7i8UgsIlNxu16VxdIuPE3qYMZLUX2bNcBl9jfTQYSbKutKs0JR8hDkaY-talrezKp8SWaNto_vjJ01YVjniOdTYCzTN_Wz22wjSV2ltq8gQ6fHml4_FYBq83OG0eOI7oJl5fSTdtBJledYKm_nyrFr78MlkvU9yP0Nu89sTgO_OaBIzbF4aFkyyy1aNc5uYtH0Ikf7JlSXiqfFcsnq0_lAT0QF2ZSiuag9V7mJaSK4GWb0S1NQs" />
                            <div className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 bg-[#00a669] flex items-center justify-center text-white text-xs font-bold">+1k</div>
                        </div>
                        <h3 className="text-xl font-bold text-[#064e3b] dark:text-white mb-2">Join 1,000+ Merchants</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm italic">"{platformName} mengubah cara kami melayani pelanggan. QR Menu sangat membantu saat jam sibuk."</p>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-rounded text-sm">star</span>)}
                            </div>
                            <span className="text-xs font-bold text-slate-400">Rating 4.9/5</span>
                        </div>
                    </div>
                    <ul className="space-y-4">
                        {['Aktivasi Instan & Cepat', 'Tanpa Biaya Tersembunyi', 'Support WhatsApp 24/7'].map(item => (
                            <li key={item} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-rounded text-[#00a669]">verified</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </aside>
                <section className="flex-1">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 lg:p-12 border border-green-100 dark:border-slate-700 shadow-2xl shadow-green-900/5">
                        {/* Step Indicator */}
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-10 h-10 rounded-full ${step === 1 ? 'bg-[#00a669] text-white' : 'bg-green-100 text-[#00a669]'} flex items-center justify-center font-bold`}>1</div>
                                    <span className={`text-xs font-bold ${step === 1 ? 'text-[#00a669]' : 'text-slate-500'}`}>Bisnis</span>
                                </div>
                                <div className={`flex-1 h-[2px] mx-4 ${step === 2 ? 'bg-[#00a669]' : 'bg-[#00a669] opacity-20'}`}></div>
                                <div className={`flex flex-col items-center gap-2 ${step === 1 ? 'opacity-40' : ''}`}>
                                    <div className={`w-10 h-10 rounded-full ${step === 2 ? 'bg-[#00a669] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'} flex items-center justify-center font-bold`}>2</div>
                                    <span className={`text-xs font-bold ${step === 2 ? 'text-[#00a669]' : 'text-slate-500'}`}>Pemilik</span>
                                </div>
                            </div>
                        </div>

                        <form className="space-y-8" onSubmit={handleRegister}>
                            {/* STEP 1: Info Bisnis */}
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <h2 className="text-2xl font-bold text-[#064e3b] dark:text-white">Informasi Bisnis</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Restoran</label>
                                            <input name="name" value={formData.name} onChange={handleChange} required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="Contoh: Kopi Senja Utama" type="text" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tipe Bisnis</label>
                                            <select name="description" value={formData.description} onChange={handleChange} required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all">
                                                <option value="">Pilih Tipe Bisnis</option>
                                                <option value="Coffee Shop / Cafe">Coffee Shop / Cafe</option>
                                                <option value="Restoran Cepat Saji">Restoran Cepat Saji</option>
                                                <option value="Bakery">Bakery</option>
                                                <option value="UMKM / Food Stall">UMKM / Food Stall</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alamat Lengkap</label>
                                        <textarea name="address" value={formData.address} onChange={handleChange} required
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                            placeholder="Masukkan alamat lengkap restoran Anda..." rows={3} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Dynamic Plan Selector */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pilih Paket</label>
                <select name="package" value={formData.package} onChange={handleChange} required disabled={plansLoading}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all disabled:opacity-50">
                    {plansLoading ? (
                        <option>Memuat paket...</option>
                    ) : plans.length > 0 ? (
                        plans.map(plan => (
                            <option key={plan.id} value={plan.name} disabled={(plan as any).disabled}>
                                {plan.price === 0
                                    ? `Free Trial (Gratis)`
                                    : `${plan.name} (Rp ${plan.price.toLocaleString('id-ID')} / bln)`}
                            </option>
                        ))
                                                ) : (
                                                    <>
                                                        <option value="FREE_TRIAL">Free Trial (Gratis)</option>
                                                        <option value="BUSINESS">Bisnis (Rp 200.000 / bln)</option>
                                                    </>
                                                )}
                                            </select>
                                        {!plansLoading && (() => {
                                            const sel = plans.find(p => p.name === formData.package)
                                            if (!sel) return null

                                            return (
                                                <div className="mt-4 space-y-4">
                                                    {sel.price === 0 ? (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            ✅ Free Trial aktif langsung selama 30 hari.
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Siklus Tagihan</label>
                                                                <select name="billingCycle" value={formData.billingCycle} onChange={handleChange} required
                                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all">
                                                                    <option value="1">1 Bulan</option>
                                                                    <option value="3">3 Bulan</option>
                                                                    <option value="6">6 Bulan</option>
                                                                    <option value="12">1 Tahun</option>
                                                                </select>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                💳 Perlu pembayaran setelah daftar untuk mengaktifkan akun.
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jumlah Meja</label>
                                            <input name="tableCount" value={formData.tableCount} onChange={handleChange} required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="Contoh: 15" type="number" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Info Pemilik */}
                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <h2 className="text-2xl font-bold text-[#064e3b] dark:text-white">Informasi Pemilik</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Pemilik</label>
                                            <input name="ownerName" value={formData.ownerName} onChange={handleChange} required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="Contoh: Budi Santoso" type="text" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                                            <input name="email" value={formData.email} onChange={handleChange} required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="owner@restoran.com" type="email" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nomor HP</label>
                                            <input name="phone" value={formData.phone} onChange={handleChange} required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="0812..." type="text" />
                                        </div>
                                        {/* Password with Strength Meter */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                                            <div className="relative">
                                                <input name="password" value={formData.password} onChange={handleChange} required minLength={8}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 pr-12 dark:text-white transition-all"
                                                    placeholder="Min. 8 karakter"
                                                    type={showPassword ? 'text' : 'password'} />
                                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                    <span className="material-symbols-rounded text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                                </button>
                                            </div>
                                            {formData.password.length > 0 && (
                                                <div className="space-y-1.5 mt-1">
                                                    {/* Progress bar */}
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4].map(i => (
                                                            <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                                                                style={{ backgroundColor: i <= pwStrength.score ? pwStrength.color : '#e2e8f0' }} />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs font-semibold" style={{ color: pwStrength.color }}>{pwStrength.label}</p>
                                                    <ul className="text-xs space-y-0.5">
                                                        <li className={formData.password.length >= 8 ? 'text-green-500' : 'text-slate-400'}>✓ Min. 8 karakter</li>
                                                        <li className={/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-slate-400'}>✓ Huruf kapital (A-Z)</li>
                                                        <li className={/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-slate-400'}>✓ Angka (0-9)</li>
                                                        <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-500' : 'text-slate-400'}>✓ Karakter spesial (!@#$...)</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-gray-50 dark:bg-gray-900 mt-4">
                                        <Checkbox id="captcha" checked={captchaVerified} onCheckedChange={(c) => setCaptchaVerified(c as boolean)} />
                                        <label htmlFor="captcha" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none dark:text-white">
                                            Saya menyetujui Syarat & Ketentuan.
                                        </label>
                                    </div>

                                    <div className="p-6 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-start gap-4">
                                        <span className="material-symbols-rounded text-[#00a669]">info</span>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-[#00a669]">Butuh bantuan daftar?</h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Tim kami siap membantu proses pendaftaran Anda. <a className="text-[#00a669] font-bold underline" href="mailto:support@meenuin.biz.id?subject=Bantuan%20Pendaftaran%20Meenuin">Kirim email ke support@meenuin.biz.id</a></p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                {step === 1 ? (
                                    <button className="flex-1 py-4 px-6 bg-[#00a669] text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 group disabled:opacity-50"
                                        type="button" onClick={handleNextStep}>
                                        Lanjutkan Ke Info Pemilik
                                        <span className="material-symbols-rounded transition-transform group-hover:translate-x-1">arrow_forward</span>
                                    </button>
                                ) : (
                                    <div className="flex w-full gap-4">
                                        <button className="py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center"
                                            type="button" onClick={handleBackStep}>
                                            <span className="material-symbols-rounded mr-2">arrow_back</span> Kembali
                                        </button>
                                        <button className="flex-1 py-4 px-6 bg-[#00a669] text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 group disabled:opacity-50"
                                            type="submit" disabled={loading}>
                                            {loading ? 'Mendaftar...' : 'Selesaikan Pendaftaran'}
                                            <span className="material-symbols-rounded transition-transform group-hover:translate-x-1">check_circle</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                                Dengan mendaftar, Anda menyetujui <a className="underline" href="#">Syarat & Ketentuan</a> serta <a className="underline" href="#"> Kebijakan Privasi</a> {platformName}.
                            </p>
                        </form>
                    </div>
                </section>
            </main>
            <footer className="mt-20 py-12 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} {platformName} Technology. All rights reserved.</p>
                    </div>
                </div>
            </footer>
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
                <a href="https://wa.me/6288294945050" target="_blank" rel="noopener noreferrer"
                    className="p-3 bg-[#00a669] shadow-xl rounded-full text-white hover:scale-110 transition-transform flex items-center justify-center"
                    title="Bantuan WhatsApp">
                    <span className="material-symbols-rounded">help</span>
                </a>
                <button className="p-3 bg-white dark:bg-slate-800 shadow-xl rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:scale-110 transition-transform flex items-center justify-center" onClick={toggleDarkMode}>
                    <span className="material-symbols-rounded dark:hidden">dark_mode</span>
                    <span className="material-symbols-rounded hidden dark:block">light_mode</span>
                </button>
            </div>
        </div>
    )
}

export default function Register() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#f4fdf9] dark:bg-[#0f172a]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a669]"></div>
            </div>
        }>
            <RegisterContent />
        </Suspense>
    )
}
