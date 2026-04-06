'use client'

import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { QRCodeSVG } from 'qrcode.react'

export default function SecuritySettingsPage() {
    const [loading, setLoading] = useState(false)
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [secret, setSecret] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState(1) // 1: Overview, 2: Setup QR, 3: Disable

    const startSetup = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate' })
            })
            const data = await res.json()
            if (data.success) {
                setQrCodeUrl(data.otpauthUrl)
                setSecret(data.secret)
                setStep(2)
            } else {
                toast({ title: 'Error', description: data.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Sistem Gagal Generate 2FA', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const enable2FA = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'enable', token: otp, secret })
            })
            const data = await res.json()
            if (data.success) {
                toast({ title: 'Autentikasi Berhasil', description: '2FA berhasil diaktifkan!' })
                setStep(1)
                setOtp('')
            } else {
                toast({ title: 'Token Salah', description: data.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Gagal verifikasi OTP', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const disable2FA = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disable', token: otp })
            })
            const data = await res.json()
            if (data.success) {
                toast({ title: 'Berhasil', description: '2FA berhasil dinonaktifkan' })
                setStep(1)
                setOtp('')
            } else {
                toast({ title: 'Token Salah', description: data.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Gagal nonaktifkan 2FA', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Pengaturan Keamanan</h1>
                <p className="text-slate-500">Kelola Autentikasi Dua Langkah (2FA) untuk meningkatkan keamanan portal restoran Anda.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-rounded text-2xl">security</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Autentikasi Dua Langkah (Opsional)</h2>
                                <p className="text-sm text-slate-500 mt-1">Tambahkan lapisan keamanan ekstra ke akun Anda. Setelah memasukkan sandi, Anda akan dimintai kode unik yang di-generate dari aplikasi (Google Authenticator/Authy).</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={startSetup}
                                disabled={loading}
                                className="bg-[#00a669] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-all flex items-center gap-2">
                                <span className="material-symbols-rounded text-[18px]">add_moderator</span>
                                Aktifkan 2FA
                            </button>
                            <button 
                                onClick={() => setStep(3)}
                                className="bg-white border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                                <span className="material-symbols-rounded text-[18px]">remove_moderator</span>
                                Nonaktifkan 2FA
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div>
                            <h2 className="text-xl font-semibold mb-1">Set Up 2FA</h2>
                            <p className="text-sm text-slate-500">Scan QR code ini menggunakan aplikasi Authenticator.</p>
                        </div>
                        <div className="flex justify-center p-6 bg-white rounded-xl border border-slate-200">
                            {qrCodeUrl ? (
                                <QRCodeSVG value={qrCodeUrl} size={200} />
                            ) : (
                                <div className="h-[200px] w-[200px] bg-slate-100 animate-pulse rounded-md"></div>
                            )}
                        </div>
                        <p className="text-sm text-center font-mono opacity-60">Secret: {secret}</p>
                        <form onSubmit={enable2FA} className="space-y-4 max-w-sm mx-auto">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Masukkan 6-digit PIN</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-center tracking-widest text-lg focus:ring-[#00a669]"
                                    maxLength={6} 
                                    value={otp} 
                                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="000000"
                                    required 
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 rounded-lg font-semibold hover:opacity-80">Batal</button>
                                <button type="submit" disabled={loading || otp.length < 6} className="flex-1 bg-[#00a669] text-white py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-70">Verifikasi</button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div>
                            <h2 className="text-xl font-semibold mb-1 text-red-600">Matikan 2FA</h2>
                            <p className="text-sm text-slate-500">Untuk menonaktifkan fitur ini, masukkan PIN dari aplikasi Authenticator Anda saat ini.</p>
                        </div>
                        <form onSubmit={disable2FA} className="space-y-4 max-w-sm">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5">Kode OTP Saat Ini</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 tracking-widest text-lg focus:ring-red-500"
                                    maxLength={6} 
                                    value={otp} 
                                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="000000"
                                    required 
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-2.5 rounded-lg font-semibold hover:opacity-80">Batal</button>
                                <button type="submit" disabled={loading || otp.length < 6} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-70">Matikan 2FA</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
