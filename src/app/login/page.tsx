'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'

export default function RestaurantAdminLoginPage() {
    const { setUser, user, helpdeskSettings } = useAppStore()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    // Simple math captcha
    const [captchaNum1, setCaptchaNum1] = useState(0)
    const [captchaNum2, setCaptchaNum2] = useState(0)
    const [captchaAnswer, setCaptchaAnswer] = useState('')

    useEffect(() => {
        setMounted(true)
        useAppStore.persist.rehydrate()
        generateCaptcha()

        // If already logged in
        if (user) {
            if (user.role === 'SUPER_ADMIN') router.push('/admin')
            else if (user.role === 'RESTAURANT_ADMIN') router.push('/dashboard')
            else router.push('/')
        }
    }, [user, router])

    const generateCaptcha = () => {
        setCaptchaNum1(Math.floor(Math.random() * 10) + 1)
        setCaptchaNum2(Math.floor(Math.random() * 10) + 1)
        setCaptchaAnswer('')
    }

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a669]"></div>
            </div>
        )
    }

    const platformName = helpdeskSettings?.platformName || 'Meenuin'

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        // Validate captcha
        const correctAnswer = captchaNum1 + captchaNum2
        if (parseInt(captchaAnswer) !== correctAnswer) {
            toast({ title: 'Captcha Error', description: 'Jawaban captcha salah', variant: 'destructive' })
            generateCaptcha()
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Login failed')
            }

            const userData = data.user
            setUser(userData)
            toast({ title: 'Selamat Datang!', description: `Login sebagai ${userData.name}` })

            // Redirect based on role
            if (userData.role === 'SUPER_ADMIN') {
                window.location.href = '/admin'
            } else if (userData.role === 'RESTAURANT_ADMIN') {
                window.location.href = '/dashboard'
            } else {
                window.location.href = '/'
            }
        } catch (error: any) {
            console.error('Login Error:', error)
            toast({
                title: 'Login Gagal',
                description: error.message || 'Terjadi kesalahan sistem. Silakan coba lagi.',
                variant: 'destructive',
            })
            generateCaptcha()
        } finally {
            setLoading(false)
        }
    }

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle('dark')
    }

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-200 min-h-screen flex items-center justify-center p-0">
            <div className="flex w-full min-h-screen">
                <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between text-white" style={{
                    backgroundColor: '#00a669',
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuDxxGoviN6BHCNdHXq2rl_-CYNSu0kFzb4xp9raSQa1iaAfwVQuqPDwhDUranyi51RM6iDCpdfYsgUKMnIyc2mipKJn4lLS1QwMEprL7TWnM0r58whs4nsSDzrKc4Fhw0cXnHQ2Wr1QGBxjIoesbIO3hZ4RfxOUvttI8QotuyGvYjp8LV0qk8N8pSLM5rLq-xAnlG_cepA0egQswa-vZnqyskfKLWukvHT6Ny-ARL8RimZ93ldLi-_KcYUv7GtolEv8Bo3zSlsSsPHh)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-white p-2 rounded-lg">
                            <span className="material-symbols-rounded text-[#00a669] text-3xl">restaurant</span>
                        </div>
                        <span className="text-2xl font-extrabold tracking-tight">{platformName}</span>
                    </Link>
                    <div className="max-w-md">
                        <div className="mb-8">
                            <div className="flex gap-1 text-yellow-400 mb-4">
                                <span className="material-symbols-rounded">star</span>
                                <span className="material-symbols-rounded">star</span>
                                <span className="material-symbols-rounded">star</span>
                                <span className="material-symbols-rounded">star</span>
                                <span className="material-symbols-rounded">star</span>
                            </div>
                            <blockquote className="text-2xl font-medium leading-relaxed italic">
                                "{platformName} telah merevolusi cara kami mengelola pesanan. Efisiensi operasional kami meningkat
                                hingga 40% sejak beralih ke menu digital."
                            </blockquote>
                            <div className="mt-6 flex items-center gap-4">
                                <img alt="Budi Santoso" className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiCN85n-wvh1uKVNmoLFgfQd1nEucLmc3ZOKNOx-X2p5CeBKThMbUgzMGzpvsrJMycg8xY_XYstFbB4249Y0Y-cgKHWLVBMxyCa9hgWy1NWnp7hVpNBajq9mMFSM5aCcPMc7sXbS1XeYBaMdTnnwbGnXFvBmKU1ytpr83ZG1tzm_xx9kbZNS59-1AuGIRPolpsXgXvaYvG2ss16Swrtc2_9oKt2oBves0kkkSjrAT5eADR_qEumcsE0794gmVdSs8u2ERHCpxZzxW4" />
                                <div>
                                    <p className="font-bold">Budi Santoso</p>
                                    <p className="text-sm text-white/80">Pemilik Restoran Aroma Nusantara</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-8 text-sm text-white/60">
                        <p>© {new Date().getFullYear()} {platformName} Technology</p>
                        <div className="flex gap-4">
                            <a className="hover:text-white transition-colors" href="#">Syarat & Ketentuan</a>
                            <a className="hover:text-white transition-colors" href="#">Kebijakan Privasi</a>
                        </div>
                    </div>
                </div>
                <div
                    className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 py-12 bg-white dark:bg-slate-900">
                    <div className="max-w-md w-full">
                        <div className="lg:hidden flex justify-center mb-8">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="bg-[#00a669] p-2 rounded-lg">
                                    <span className="material-symbols-rounded text-white text-2xl">restaurant</span>
                                </div>
                                <span
                                    className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{platformName}</span>
                            </Link>
                        </div>
                        <div className="mb-10 text-center lg:text-left">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Selamat Datang Kembali</h1>
                            <p className="text-slate-500 dark:text-slate-400">Masuk ke portal restoran Anda untuk mengelola menu dan
                                pesanan.</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-8">
                            <button
                                className="flex-1 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm transition-all pointer-events-none">
                                Login
                            </button>
                            <Link href="/register"
                                className="flex-1 text-center py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-all">
                                Daftar
                            </Link>
                        </div>
                        <form className="space-y-5" onSubmit={handleLogin}>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                                    htmlFor="email">Alamat Email</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <span className="material-symbols-rounded text-[20px]">mail</span>
                                    </span>
                                    <input
                                        className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                                        id="email" name="email" placeholder="email@restoran.com" required type="email"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                                        htmlFor="password">Kata Sandi</label>
                                    <a className="text-sm font-semibold text-[#00a669] hover:underline" href="#">Lupa Password?</a>
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <span className="material-symbols-rounded text-[20px]">lock</span>
                                    </span>
                                    <input
                                        className="block w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-[#00a669] focus:border-[#00a669] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                                        id="password" name="password" placeholder="••••••••" required type="password"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                            </div>
                            <div
                                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl font-bold text-[#00a669] dark:text-[#00a669]">{captchaNum1} + {captchaNum2} = ?</span>
                                    <input
                                        className="w-20 py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center dark:text-white focus:ring-[#00a669] outline-none"
                                        placeholder="Jawaban" type="number" value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} required />
                                </div>
                                <button className="text-slate-400 hover:text-[#00a669] transition-colors" type="button" onClick={generateCaptcha}>
                                    <span className="material-symbols-rounded">refresh</span>
                                </button>
                            </div>
                            <button
                                className="w-full bg-[#00a669] hover:bg-opacity-90 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
                                type="submit" disabled={loading}>
                                {loading ? 'Memproses...' : 'Masuk Ke Portal'}
                                <span
                                    className="material-symbols-rounded group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </form>

                        <div className="mt-10 flex flex-col items-center gap-4 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Belum punya akun {platformName}?
                                <Link className="text-[#00a669] font-bold hover:underline ml-1" href="/register">Daftar Restoran</Link>
                            </p>
                            <div
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                <span className="material-symbols-rounded text-[14px]">shield</span>
                                Protected by {platformName} Secure Login
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button
                className="fixed bottom-6 right-6 p-3 bg-white dark:bg-slate-800 shadow-xl rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:scale-110 transition-transform z-50"
                onClick={toggleDarkMode}>
                <span className="material-symbols-rounded dark:hidden">dark_mode</span>
                <span className="material-symbols-rounded hidden dark:block">light_mode</span>
            </button>
        </div>
    )
}
