'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAppStore } from '@/store/app-store'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/hooks/use-toast'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
function LoginPageContent() {
    const { setUser, user, isInitialized, helpdeskSettings } = useAppStore()
    const router = useRouter()
    const searchParams = useSearchParams()
    const isDemoMode = searchParams.get('mode') === 'demo'
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

    const [requires2FA, setRequires2FA] = useState(false)
    const [preAuthToken, setPreAuthToken] = useState('')
    const [otpToken, setOtpToken] = useState('')


    useEffect(() => {
        setMounted(true)
        generateCaptcha()
        // Auto-fill demo credentials if coming from ?mode=demo
        if (searchParams.get('mode') === 'demo') {
            setFormData({ email: 'demo@restohub.id', password: 'demo1234' })
        }
    }, [])

    useEffect(() => {
        // If already logged in and session is verified, redirect to appropriate dashboard
        if (isInitialized && user) {
            if (user.role === 'SUPER_ADMIN') {
                router.push('/admin')
            } else if (user.role === 'RESTAURANT_ADMIN') {
                router.push('/dashboard')
            }
            // Do NOT redirect to '/' for unknown roles — stay on login page
        }
    }, [user, isInitialized, router])

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

            if (data.requires2FA) {
                setRequires2FA(true)
                setPreAuthToken(data.preAuthToken)
                toast({ title: '2FA Dibutuhkan', description: 'Silahkan masukkan kode OTP dari aplikasi authenticator Anda.' })
                return
            }

            const userData = data.user
            setUser(userData)
            toast({ title: 'Selamat Datang!', description: `Login sebagai ${userData.name}` })

            // Redirect based on role
            if (userData.role === 'SUPER_ADMIN') {
                router.push('/admin')
            } else if (userData.role === 'RESTAURANT_ADMIN') {
                router.push('/dashboard')
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

    const handleGoogleLogin = async (credential: string | undefined) => {
        if (!credential) return
        setLoading(true)
        try {
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Google Login failed')

            if (data.requires2FA) {
                setRequires2FA(true)
                setPreAuthToken(data.preAuthToken)
                toast({ title: '2FA Dibutuhkan', description: 'Silahkan masukkan kode OTP dari aplikasi authenticator Anda.' })
                return
            }

            const userData = data.user
            setUser(userData)
            toast({ title: 'Selamat Datang!', description: `Login sebagai ${userData.name}` })
            if (userData.role === 'SUPER_ADMIN') router.push('/admin')
            else if (userData.role === 'RESTAURANT_ADMIN') router.push('/dashboard')
        } catch (error: any) {
            toast({ title: 'Sistem Google Login', description: error.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleVerify2FA = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (otpToken.length < 6) return
        setLoading(true)
        try {
            const response = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preAuthToken, token: otpToken })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Verifikasi gagal')

            const userData = data.user
            setUser(userData)
            toast({ title: 'Verifikasi Berhasil', description: `Login sebagai ${userData.name}` })
            if (userData.role === 'SUPER_ADMIN') router.push('/admin')
            else if (userData.role === 'RESTAURANT_ADMIN') router.push('/dashboard')
        } catch (error: any) {
            toast({ title: 'Verifikasi Gagal', description: error.message, variant: 'destructive' })
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
                        {requires2FA ? (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Verifikasi 2-Langkah</h2>
                                    <p className="text-slate-500 mt-2">Masukkan kode OTP dari aplikasi Google Authenticator Anda.</p>
                                </div>
                                <form onSubmit={handleVerify2FA} className="space-y-6 flex flex-col items-center">
                                    <InputOTP maxLength={6} value={otpToken} onChange={(val) => setOtpToken(val)}>
                                      <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                      </InputOTPGroup>
                                    </InputOTP>
                                    <button
                                        className="w-full bg-[#00a669] hover:bg-opacity-90 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center"
                                        type="submit" disabled={loading || otpToken.length < 6}>
                                        {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
                                    </button>
                                    <button type="button" onClick={() => setRequires2FA(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Kembali ke Login</button>
                                </form>
                            </div>
                        ) : (
                            <>
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
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                            <button
                                className="flex-1 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm transition-all pointer-events-none">
                                Login
                            </button>
                            <Link href="/register"
                                className="flex-1 text-center py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-all">
                                Daftar
                            </Link>
                        </div>

                        {/* ── Demo Account Banner ── */}
                        <div className={`mb-6 rounded-2xl p-4 border ${isDemoMode
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                            }`}>
                            <div className="flex items-start gap-3">
                                <span className={`material-symbols-rounded text-2xl mt-0.5 ${isDemoMode ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {isDemoMode ? 'play_circle' : 'science'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold mb-0.5 ${isDemoMode ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                                        {isDemoMode ? '🎯 Mode Demo Aktif' : 'Mode Demo Tersedia'}
                                    </p>
                                    <p className={`text-xs mb-3 ${isDemoMode ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                        {isDemoMode
                                            ? 'Kredensial sudah terisi. Jawab captcha lalu klik "Masuk Ke Portal" untuk mulai demo.'
                                            : 'Jelajahi fitur lengkap tanpa perlu daftar. Email & password akan terisi otomatis.'}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ email: 'demo@restohub.id', password: 'demo1234' })}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isDemoMode
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                                                }`}>
                                            <span className="material-symbols-rounded text-[14px]">bolt</span>
                                            {isDemoMode ? 'Isi Ulang Credential' : 'Gunakan Akun Demo'}
                                        </button>
                                        <Link href="/demo"
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border ${isDemoMode
                                                ? 'border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                                : 'border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                                }`}>
                                            <span className="material-symbols-rounded text-[14px]">menu_book</span>
                                            Panduan Demo
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                            <div className="mb-6">
                                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
                                    <div className="flex justify-center w-full min-h-[44px] [&>div]:w-full [&>div]:flex [&>div]:justify-center">
                                        <GoogleLogin
                                            onSuccess={res => handleGoogleLogin(res.credential)}
                                            onError={() => {
                                                console.error('Google Login Error');
                                                toast({ title: 'Sistem Google', description: 'Google Login mungkin diblokir di dalam aplikasi. Gunakan browser luar jika tidak muncul.', variant: 'destructive' });
                                            }}
                                            useOneTap={false} // Disable one-tap in WebView as it often fails
                                            shape="rectangular"
                                            theme="filled_blue"
                                            text="signin_with"
                                            size="large"
                                            width="100%"
                                        />
                                    </div>
                                </GoogleOAuthProvider>
                                <div className="mt-6 flex items-center justify-center gap-4">
                                    <hr className="w-1/3 border-slate-200 dark:border-slate-700" />
                                    <span className="text-xs text-slate-400 font-semibold uppercase">Atau Email</span>
                                    <hr className="w-1/3 border-slate-200 dark:border-slate-700" />
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-3 bg-red-50 text-red-500 rounded-lg text-xs font-medium text-center">
                                Google Client ID belum dikonfigurasi (.env)
                            </div>
                        )}

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
                                    <Link className="text-sm font-semibold text-[#00a669] hover:underline" href="/forgot-password">Lupa Password?</Link>
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
                        </>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
                <a href="https://wa.me/6288294945050" target="_blank" rel="noopener noreferrer"
                    className="p-3 bg-[#00a669] shadow-xl rounded-full text-white hover:scale-110 transition-transform flex items-center justify-center"
                    title="Bantuan WhatsApp">
                    <span className="material-symbols-rounded">help</span>
                </a>
                <button
                    className="p-3 bg-white dark:bg-slate-800 shadow-xl rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:scale-110 transition-transform flex items-center justify-center"
                    onClick={toggleDarkMode}
                    title="Toggle Tema">
                    <span className="material-symbols-rounded dark:hidden">dark_mode</span>
                    <span className="material-symbols-rounded hidden dark:block">light_mode</span>
                </button>
            </div>
        </div>
    )
}

export default function RestaurantAdminLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a669]"></div>
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    )
}
