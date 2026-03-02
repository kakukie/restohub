'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import Link from 'next/link'

interface SubscriptionPlan {
  id: 'BASIC' | 'PRO' | 'ENTERPRISE' | string
  name: string
  description: string
  price: number
  menuLimit: number
  features: string[]
  isActive: boolean
}

// Mock subscription plans fallback
const subscriptionPlansMock: SubscriptionPlan[] = [
  {
    id: 'FREE_TRIAL',
    name: 'Free Trial',
    description: 'Perfect for testing Meenuin features',
    price: 0,
    menuLimit: 20,
    features: ['14 Hari Uji Coba Penuh', 'Maks. 20 Menu Items', 'QR Code Standar', 'Support Email'],
    isActive: true
  },
  {
    id: 'BUSINESS',
    name: 'Business Package',
    description: 'Full ecosystem for growing F&B',
    price: 99000,
    menuLimit: 9999, // unlimited
    features: ['Unlimited Menu Items', 'Custom QR Branding', 'Kitchen Display System', 'Laporan Penjualan Real-time', 'Priority Support 24/7'],
    isActive: true
  }
]

export default function LandingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const { helpdeskSettings } = useAppStore()

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/subscription-plans')
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          setPlans(data.data)
        } else {
          setPlans(subscriptionPlansMock)
        }
      } catch (error) {
        setPlans(subscriptionPlansMock)
      }
    }
    fetchPlans()
  }, [])

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark')
  }

  const platformName = helpdeskSettings?.platformName || 'Meenuin'

  return (
    <div className="bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-300 min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-[#00a669] p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-white text-2xl">restaurant_menu</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[#00a669]">{platformName}</span>
          </div>
          <div className="hidden md:flex items-center gap-10 font-semibold text-slate-600 dark:text-slate-400">
            <a className="hover:text-[#00a669] transition-colors" href="#fitur">Fitur</a>
            <a className="hover:text-[#00a669] transition-colors" href="#harga">Harga</a>
            <a className="hover:text-[#00a669] transition-colors" href="#kontak">Kontak</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={toggleDarkMode}>
              <span className="material-symbols-outlined dark:hidden">dark_mode</span>
              <span className="material-symbols-outlined hidden dark:block">light_mode</span>
            </button>
            <Link href="/register" className="bg-[#00a669] hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-[#00a669]/20 transition-all hover:-translate-y-0.5"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 overflow-hidden" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(0, 163, 104, 0.08) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(0, 163, 104, 0.05) 0%, transparent 40%)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 z-10">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-[#00a669] text-sm font-bold border border-emerald-100 dark:border-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a669] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00a669]"></span>
                </span>
                Update v3.2: Mobile Experience Optimized
              </div>
              <h1
                className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
                Modern Menu <br />
                <span className="text-[#00a669]">Ecosystem</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                Berikan pengalaman bersantap yang tak terlupakan dengan menu digital interaktif. Kelola pesanan
                dengan mulus di berbagai perangkat.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/register"
                  className="bg-[#00a669] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#00a669]/25 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                  Mulai Sekarang <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <button
                  className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">play_circle</span> Lihat Demo
                </button>
              </div>
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">500+</div>
                  <div className="text-slate-500 text-sm">Merchants</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">120k+</div>
                  <div className="text-slate-500 text-sm">Orders</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">99.9%</div>
                  <div className="text-slate-500 text-sm">Uptime</div>
                </div>
              </div>
            </div>
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div
                className="absolute w-[450px] md:w-[600px] h-[350px] md:h-[450px] bg-slate-800 rounded-[2.5rem] border-[12px] border-slate-900 overflow-hidden -rotate-3 translate-x-[-10%] z-0 hidden md:block" style={{ boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.12), 0 30px 60px -30px rgba(0, 0, 0, 0.15)' }}>
                <div className="w-full h-full bg-slate-50 dark:bg-slate-900 p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    <div className="flex gap-4">
                      <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                      <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                    <div className="col-span-2 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                    <div className="h-32 bg-[#00a669]/10 rounded-2xl"></div>
                  </div>
                </div>
              </div>
              <div
                className="relative w-[280px] h-[560px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-900 overflow-hidden rotate-2 z-10" style={{ boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.12), 0 30px 60px -30px rgba(0, 0, 0, 0.15)' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20">
                </div>
                <div className="w-full h-full bg-white dark:bg-slate-900 flex flex-col">
                  <div className="h-40 bg-[#00a669]/10 p-6 flex flex-col justify-end">
                    <div className="w-24 h-4 bg-[#00a669]/40 rounded-full mb-2"></div>
                    <div className="w-40 h-6 bg-[#00a669]/60 rounded-full"></div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                        <div className="w-2/3 h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                        <div className="w-2/3 h-3 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                      </div>
                    </div>
                    <div
                      className="aspect-video bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border-2 border-dashed border-[#00a669]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#00a669] text-3xl">qr_code_2</span>
                    </div>
                    <div className="pt-4">
                      <div
                        className="w-full h-12 bg-[#00a669] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                        Checkout Now
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-[#020617]" id="fitur">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-[#00a669] font-bold tracking-widest uppercase text-sm">Keunggulan Kami</h2>
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">Solusi Terbaik Untuk
              Operasional Restoran</h3>
            <p className="text-slate-600 dark:text-slate-400">Dirancang khusus untuk membantu pemilik F&B mengelola
              bisnis dengan lebih efisien dan modern.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div
              className="group p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-[#00a669]/50 transition-all hover:shadow-2xl hover:shadow-[#00a669]/5">
              <div
                className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#00a669] text-3xl">qr_code_2</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">QR Menu</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Pelanggan bisa langsung scan dan pesan
                dari meja tanpa perlu menunggu pelayan datang membawa menu fisik.</p>
            </div>
            <div
              className="group p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-[#00a669]/50 transition-all hover:shadow-2xl hover:shadow-[#00a669]/5">
              <div
                className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#00a669] text-3xl">payments</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">QRIS Pay</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Pembayaran otomatis terintegrasi.
                Pelanggan bisa bayar langsung setelah pesan menggunakan QRIS favorit mereka.</p>
            </div>
            <div
              className="group p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-[#00a669]/50 transition-all hover:shadow-2xl hover:shadow-[#00a669]/5">
              <div
                className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#00a669] text-3xl">restaurant</span>
              </div>
              <h4 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Kitchen Display</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Monitor pesanan di dapur secara
                real-time. Tidak ada lagi pesanan yang terlewat atau salah catat.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 dark:bg-slate-950" id="harga">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">Simple, Transparent Pricing</h2>
            <p className="text-slate-600 dark:text-slate-400">Pilih paket yang paling sesuai untuk restoran Anda. Tanpa
              biaya tersembunyi, batalkan kapan saja.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.slice(0, 2).map((plan, idx) => (
              <div key={plan.id}
                className={`bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border ${idx === 1 ? 'border-2 border-[#00a669] shadow-2xl shadow-[#00a669]/10' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl'} flex flex-col h-full relative transition-shadow`}>

                {idx === 1 && (
                  <div
                    className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#00a669] text-white text-xs font-bold px-6 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-[#00a669]/30">
                    Paling Populer
                  </div>
                )}

                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h4>
                  <p className="text-slate-500">{plan.description}</p>
                </div>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-slate-900 dark:text-white">Rp {(plan.price / 1000).toLocaleString('id-ID')}k</span>
                  <span className="text-slate-400">/bulan</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[#00a669]">check_circle</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={`/register?plan=${plan.id}`}
                  className={`w-full py-4 rounded-2xl text-center flex items-center justify-center font-bold transition-all text-lg ${idx === 1 ? 'bg-[#00a669] text-white shadow-xl shadow-[#00a669]/25 hover:bg-emerald-600' : 'border-2 border-[#00a669] text-[#00a669] hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
                  {idx === 1 ? 'Pilih Paket Bisnis' : 'Mulai Coba Gratis'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-[#020617]" id="kontak">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-12">Hubungi Kami</h2>
          <div className="flex flex-col md:flex-row justify-center gap-8">
            <div
              className="flex-1 max-w-sm bg-emerald-50 dark:bg-emerald-900/10 p-10 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 flex flex-col items-center">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm mb-6">
                <span className="material-symbols-outlined text-[#00a669] text-3xl">phone_iphone</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">WhatsApp</h4>
              <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">0812-3456-7890</p>
            </div>
            <div
              className="flex-1 max-w-sm bg-emerald-50 dark:bg-emerald-900/10 p-10 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 flex flex-col items-center">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm mb-6">
                <span className="material-symbols-outlined text-[#00a669] text-3xl">alternate_email</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Email</h4>
              <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">support@{platformName.toLowerCase().replace(/\s+/g, '')}.biz.id</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center space-y-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#00a669] p-1.5 rounded-lg">
              <span className="material-symbols-outlined text-white text-xl">restaurant_menu</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#00a669]">{platformName}</span>
          </div>
          <p className="text-slate-500 text-sm text-center">© {new Date().getFullYear()} {platformName} Technology. All rights reserved.</p>
          <div
            className="inline-flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-4 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
            <span className="text-[#00a669] font-mono text-xs font-bold">v3.2.0 {platformName}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
