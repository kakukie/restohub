'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore, Restaurant } from '@/store/app-store'
import { toast } from '@/hooks/use-toast'

export default function Register() {
    const router = useRouter()
    const { addRestaurant, helpdeskSettings } = useAppStore()
    const [loading, setLoading] = useState(false)
    const [captchaVerified, setCaptchaVerified] = useState(false)

    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        ownerName: '',
        password: '',
        package: 'FREE_TRIAL',
        description: '',
        tableCount: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const platformName = helpdeskSettings?.platformName || 'Meenuin'

    const handleNextStep = () => {
        if (!formData.name || !formData.address || !formData.description || !formData.tableCount) {
            toast({ title: 'Validation Error', description: 'Silakan isi semua data bisnis', variant: 'destructive' })
            return
        }
        setStep(2)
    }

    const handleBackStep = () => {
        setStep(1)
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!captchaVerified) {
            toast({
                title: "Validation Error",
                description: "Centang kotak captcha persetujuan.",
                variant: "destructive"
            })
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

            if (!response.ok) {
                throw new Error(data.error || 'Registrasi gagal')
            }

            toast({
                title: "Registration Successful",
                description: "Your restaurant has been registered!",
            })

            router.push('/login')
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Registration failed. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark')
    }

    return (
        <div className="bg-[#f4fdf9] dark:bg-[#0f172a] min-h-screen transition-colors duration-300">
            <nav
                className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-green-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-[#00a669] p-2 rounded-lg">
                            <span className="material-symbols-rounded text-white text-2xl">restaurant</span>
                        </div>
                        <span className="text-2xl font-extrabold text-[#064e3b] dark:text-white">{platformName}</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#00a669] transition-colors"
                            href="#">Bantuan</a>
                        <button
                            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-all focus:outline-none"
                            onClick={toggleDarkMode}>
                            <span className="material-symbols-rounded text-sm dark:hidden">dark_mode</span>
                            <span className="material-symbols-rounded text-sm hidden dark:block">light_mode</span>
                        </button>
                        <Link className="text-sm font-semibold bg-green-50 dark:bg-slate-800 text-[#00a669] px-5 py-2.5 rounded-full hover:bg-green-100 transition-all"
                            href="/login">Sudah punya akun? Login</Link>
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
                            Bergabunglah dengan ribuan pemilik bisnis kuliner yang telah meningkatkan efisiensi operasional
                            dengan {platformName}.
                        </p>
                    </div>
                    <div
                        className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-green-100 dark:border-slate-700 shadow-xl shadow-green-900/5">
                        <div className="flex -space-x-3 mb-6">
                            <img alt="Merchant 1"
                                className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIGToXp7kUAYXGQcb_xGl-ysGYst0wD7y8D85HlTrPwX2IUkgsx20-ghDqLs_hnj0nK-sq9viH3pOs9unz4MpdsM70avM2R3drHa3Bvov6f15Qc4Udn_DaX-EZI95D1-hTxykE0QYJuAmWfbciMAO5UW1HbX7ww6ZYu2hd9Telnr0XJGsaYset4-YEs-UYQRSHmzo2imVIiU8IGdK7Plqzv-Y6xTLi9tDr61cJojT2EoGDIMS8Iu7CEqpC-jTVQuLz83ZbtfgQDoMj" />
                            <img alt="Merchant 2"
                                className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH8zJywtu7DBLfKHq-xgaKgUiaUXZVvj0tFxHgvzU-hUUo1fuCQWlfATIJKoHk5XrKhFUIHPhiL37Iu2ltZYo3BhuUxdOrlfgkKgZxpq71165gOxIhfimR1HGLFrGQ1Kh-VSN0NGz4qEOVc3ku-PEimNa3YUrsZmSpuH9n7HioAtczyMoBkLGbnKTQlfnHgZeb-OgHXDe5d-8yenRoWcx6DATHFkxNeKQlwxzg71Q_Reyn_xx1sI4VAWh4s2tne-e65XXBNV-S_W0Z" />
                            <img alt="Merchant 3"
                                className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3-drkNstTzbF4bpB4D4Ha93Kdm7i8UgsIlNxu16VxdIuPE3qYMZLUX2bNcBl9jfTQYSbKutKs0JR8hDkaY-talrezKp8SWaNto_vjJ01YVjniOdTYCzTN_Wz22wjSV2ltq8gQ6fHml4_FYBq83OG0eOI7oJl5fSTdtBJledYKm_nyrFr78MlkvU9yP0Nu89sTgO_OaBIzbF4aFkyyy1aNc5uYtH0Ikf7JlSXiqfFcsnq0_lAT0QF2ZSiuag9V7mJaSK4GWb0S1NQs" />
                            <div
                                className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 bg-[#00a669] flex items-center justify-center text-white text-xs font-bold">
                                +1k
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-[#064e3b] dark:text-white mb-2">Join 1,000+ Merchants</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                            "{platformName} mengubah cara kami melayani pelanggan. QR Menu sangat membantu saat jam sibuk."
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex text-amber-400">
                                <span className="material-symbols-rounded text-sm">star</span>
                                <span className="material-symbols-rounded text-sm">star</span>
                                <span className="material-symbols-rounded text-sm">star</span>
                                <span className="material-symbols-rounded text-sm">star</span>
                                <span className="material-symbols-rounded text-sm">star</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400">Rating 4.9/5</span>
                        </div>
                    </div>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-rounded text-[#00a669]">verified</span>
                            <span>Aktivasi Instan & Cepat</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-rounded text-[#00a669]">verified</span>
                            <span>Tanpa Biaya Tersembunyi</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-rounded text-[#00a669]">verified</span>
                            <span>Support WhatsApp 24/7</span>
                        </li>
                    </ul>
                </aside>
                <section className="flex-1">
                    <div
                        className="bg-white dark:bg-slate-800 rounded-3xl p-8 lg:p-12 border border-green-100 dark:border-slate-700 shadow-2xl shadow-green-900/5">
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-10 h-10 rounded-full ${step === 1 ? 'bg-[#00a669] text-white' : 'bg-green-100 text-[#00a669]'} flex items-center justify-center font-bold`}>
                                        1</div>
                                    <span className={`text-xs font-bold ${step === 1 ? 'text-[#00a669]' : 'text-slate-500'}`}>Bisnis</span>
                                </div>
                                <div className={`flex-1 h-[2px] mx-4 ${step === 2 ? 'bg-[#00a669]' : 'bg-[#00a669] opacity-20'}`}></div>
                                <div className={`flex flex-col items-center gap-2 ${step === 1 ? 'opacity-40' : ''}`}>
                                    <div
                                        className={`w-10 h-10 rounded-full ${step === 2 ? 'bg-[#00a669] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'} flex items-center justify-center font-bold`}>
                                        2</div>
                                    <span className={`text-xs font-bold ${step === 2 ? 'text-[#00a669]' : 'text-slate-500'}`}>Pemilik</span>
                                </div>
                            </div>
                        </div>
                        <form className="space-y-8" onSubmit={handleRegister}>
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <h2 className="text-2xl font-bold text-[#064e3b] dark:text-white">Informasi Bisnis</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama
                                                Restoran</label>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="Contoh: Kopi Senja Utama" type="text" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tipe
                                                Bisnis</label>
                                            <select
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all">
                                                <option value="">Pilih Tipe Bisnis</option>
                                                <option value="Coffee Shop / Cafe">Coffee Shop / Cafe</option>
                                                <option value="Restoran Cepat Saji">Restoran Cepat Saji</option>
                                                <option value="Bakery">Bakery</option>
                                                <option value="UMKM / Food Stall">UMKM / Food Stall</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alamat
                                            Lengkap</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                            placeholder="Masukkan alamat lengkap restoran Anda..." rows={3}></textarea>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pilih Paket</label>
                                            <select
                                                name="package"
                                                value={formData.package}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all">
                                                <option value="FREE_TRIAL">Free Trial (Rp 0)</option>
                                                <option value="BUSINESS">Bisnis (Rp 200.000 / bln)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jumlah
                                                Meja</label>
                                            <input
                                                name="tableCount"
                                                value={formData.tableCount}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="Contoh: 15" type="number" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <h2 className="text-2xl font-bold text-[#064e3b] dark:text-white">Informasi Pemilik</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Pemilik</label>
                                            <input
                                                name="ownerName"
                                                value={formData.ownerName}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="Contoh: Budi Santoso" type="text" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                                            <input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="owner@restoran.com" type="email" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nomor HP</label>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="0812..." type="text" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                                            <input
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] px-4 py-3 dark:text-white transition-all"
                                                placeholder="••••••••" type="password" />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-gray-50 dark:bg-gray-900 mt-4">
                                        <Checkbox id="captcha" checked={captchaVerified} onCheckedChange={(c) => setCaptchaVerified(c as boolean)} />
                                        <label
                                            htmlFor="captcha"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none dark:text-white"
                                        >
                                            Saya menyetujui Syarat & Ketentuan.
                                        </label>
                                    </div>

                                    <div
                                        className="p-6 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-start gap-4">
                                        <span className="material-symbols-rounded text-[#00a669]">info</span>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-[#00a669]">Butuh bantuan daftar?</h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Tim kami siap membantu proses
                                                pendaftaran Anda. <a className="text-[#00a669] font-bold underline"
                                                    href="mailto:support@meenuin.biz.id?subject=Bantuan%20Pendaftaran%20Meenuin">Kirim email ke support@meenuin.biz.id</a></p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                {step === 1 ? (
                                    <button
                                        className="flex-1 py-4 px-6 bg-[#00a669] text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 group disabled:opacity-50"
                                        type="button" onClick={handleNextStep}>
                                        Lanjutkan Ke Info Pemilik
                                        <span
                                            className="material-symbols-rounded transition-transform group-hover:translate-x-1">arrow_forward</span>
                                    </button>
                                ) : (
                                    <div className="flex w-full gap-4">
                                        <button
                                            className="py-4 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center"
                                            type="button" onClick={handleBackStep}>
                                            <span className="material-symbols-rounded mr-2">arrow_back</span> Kembali
                                        </button>
                                        <button
                                            className="flex-1 py-4 px-6 bg-[#00a669] text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 group disabled:opacity-50"
                                            type="submit" disabled={loading}>
                                            {loading ? 'Mendaftar...' : 'Selesaikan Pendaftaran'}
                                            <span
                                                className="material-symbols-rounded transition-transform group-hover:translate-x-1">check_circle</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                                Dengan mendaftar, Anda menyetujui <a className="underline" href="#">Syarat & Ketentuan</a> serta
                                <a className="underline" href="#"> Kebijakan Privasi</a> {platformName}.
                            </p>
                        </form>
                    </div>
                </section >
            </main >
            <footer className="mt-20 py-12 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-sm text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} {platformName} Technology. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div >
    )
}
