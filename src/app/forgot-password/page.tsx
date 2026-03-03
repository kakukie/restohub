'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Utensils } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setError('')

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await res.json()
            if (res.ok && data.success) {
                setMessage(data.message)
            } else {
                setError(data.error || 'Terjadi kesalahan')
            }
        } catch (err: any) {
            setError('Gagal memproses permintaan, periksa koneksi internet Anda.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-[#0f172a] p-4 font-sans overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-20"></div>
                <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-[#10B981] rounded-full mix-blend-screen filter blur-[128px] opacity-10 animate-blob"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-[#0ea5e9] rounded-full mix-blend-screen filter blur-[128px] opacity-10 animate-blob animation-delay-2000"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo & Brand */}
                <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="w-16 h-16 rounded-2xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center mb-6 relative group overflow-hidden shadow-2xl shadow-[#10B981]/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Utensils className="w-8 h-8 text-[#10B981] relative z-10" />
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-3xl font-extrabold text-white tracking-tight">Resto<span className="text-[#10B981]">Hub</span></span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Reset kata sandi akun Anda</p>
                </div>

                {/* Main Card */}
                <div className="bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[32px] pointer-events-none"></div>

                    {message ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-[#10B981]/20 text-[#10B981] rounded-full flex items-center justify-center mx-auto">
                                <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Email Terkirim!</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
                            </div>
                            <Link href="/login" className="inline-block mt-4 text-[#10B981] hover:text-[#059669] text-sm font-bold transition-colors">
                                Kembali ke Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-red-400 text-xl">error</span>
                                    <p className="text-red-400 text-sm font-medium text-center">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">Alamat Email</label>
                                <div className="relative group">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#10B981] transition-colors">mail</span>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-[#0f172a]/50 border border-[#334155] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all"
                                        placeholder="admin@resto.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-2xl font-bold text-sm shadow-xl shadow-[#10B981]/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Mengirim...
                                    </>
                                ) : 'Kirim Tautan Reset'}
                            </button>

                            <div className="text-center mt-6">
                                <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
                                    <span className="material-symbols-outlined text-[16px] inline-block align-middle mr-1 relative -top-[1px]">arrow_back</span>
                                    Kembali ke Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
