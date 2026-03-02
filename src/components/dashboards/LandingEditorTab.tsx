'use client'

import { useState } from 'react'
import { useAppStore, LandingPageData } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

export default function LandingEditorTab() {
    const { helpdeskSettings, updateHelpdeskSettings } = useAppStore()

    // Local state for the form so we can save it explicitly
    const [formData, setFormData] = useState<LandingPageData>(
        helpdeskSettings.landingPageData || {
            heroTitle: 'Modern Menu Ecosystem',
            heroSubtitle: 'Update v3.2: Mobile Experience Optimized',
            heroDescription: 'Berikan pengalaman bersantap yang tak terlupakan dengan menu digital interaktif. Kelola pesanan dengan mulus di berbagai perangkat.',
            statsMerchants: '500+',
            statsOrders: '120k+',
            statsUptime: '99.9%',
            feature1Title: 'QR Menu',
            feature1Desc: 'Pelanggan bisa langsung scan dan pesan dari meja tanpa perlu menunggu pelayan datang membawa menu fisik.',
            feature2Title: 'QRIS Pay',
            feature2Desc: 'Pembayaran otomatis terintegrasi. Pelanggan bisa bayar langsung setelah pesan menggunakan QRIS favorit mereka.',
            feature3Title: 'Kitchen Display',
            feature3Desc: 'Monitor pesanan di dapur secara real-time. Tidak ada lagi pesanan yang terlewat atau salah catat.',
            pricingTitle: 'Simple, Transparent Pricing',
            pricingDescription: 'Pilih paket yang paling sesuai untuk restoran Anda. Tanpa biaya tersembunyi, batalkan kapan saja.'
        }
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = () => {
        updateHelpdeskSettings({
            ...helpdeskSettings,
            landingPageData: formData
        })
        toast({
            title: "Landing Page Updated",
            description: "Perubahan pada Landing Page berhasil disimpan.",
        })
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#F8FAFC]">Landing Page Editor</h2>
                    <p className="text-slate-400">Atur tampilan dan konten halaman depan (Elementor Style).</p>
                </div>
                <Button onClick={handleSave} className="bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-[#10B981]/20 px-6">
                    <span className="material-symbols-outlined text-sm mr-2">save</span>
                    Publish Changes
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hero Section Edit */}
                <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-[#2A344A] pb-4">
                        <span className="material-symbols-outlined text-emerald-400">web</span>
                        <h3 className="text-lg font-bold text-[#F8FAFC]">Hero Section</h3>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-slate-300">Hero Subtitle</Label>
                        <Input
                            name="heroSubtitle"
                            value={formData.heroSubtitle}
                            onChange={handleChange}
                            className="bg-[#111827] border-[#2A344A] text-white focus:border-[#10B981]"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-slate-300">Hero Title (HTML supported)</Label>
                        <Input
                            name="heroTitle"
                            value={formData.heroTitle}
                            onChange={handleChange}
                            className="bg-[#111827] border-[#2A344A] text-white focus:border-[#10B981]"
                        />
                        <p className="text-xs text-slate-500">Gunakan tag &lt;br /&gt; untuk baris baru atau &lt;span className="text-[#00a669]"&gt; untuk warna khusus.</p>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-slate-300">Hero Description</Label>
                        <Textarea
                            name="heroDescription"
                            value={formData.heroDescription}
                            onChange={handleChange}
                            className="bg-[#111827] border-[#2A344A] text-white focus:border-[#10B981] min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Stats Merchants</Label>
                            <Input name="statsMerchants" value={formData.statsMerchants} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white h-9" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Stats Orders</Label>
                            <Input name="statsOrders" value={formData.statsOrders} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white h-9" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Stats Uptime</Label>
                            <Input name="statsUptime" value={formData.statsUptime} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white h-9" />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Features Section Edit */}
                    <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-3xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-[#2A344A] pb-4">
                            <span className="material-symbols-outlined text-blue-400">featured_play_list</span>
                            <h3 className="text-lg font-bold text-[#F8FAFC]">Features Section</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-slate-300">Feature 1: Title & Desc</Label>
                                <div className="flex gap-2 mb-2">
                                    <Input name="feature1Title" value={formData.feature1Title} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white" />
                                </div>
                                <Input name="feature1Desc" value={formData.feature1Desc} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-slate-400 text-sm" />
                            </div>

                            <div className="col-span-2 space-y-2 border-t border-[#2A344A] pt-4">
                                <Label className="text-slate-300">Feature 2: Title & Desc</Label>
                                <div className="flex gap-2 mb-2">
                                    <Input name="feature2Title" value={formData.feature2Title} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white" />
                                </div>
                                <Input name="feature2Desc" value={formData.feature2Desc} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-slate-400 text-sm" />
                            </div>

                            <div className="col-span-2 space-y-2 border-t border-[#2A344A] pt-4">
                                <Label className="text-slate-300">Feature 3: Title & Desc</Label>
                                <div className="flex gap-2 mb-2">
                                    <Input name="feature3Title" value={formData.feature3Title} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white" />
                                </div>
                                <Input name="feature3Desc" value={formData.feature3Desc} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-slate-400 text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Section Edit */}
                    <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-3xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-[#2A344A] pb-4">
                            <span className="material-symbols-outlined text-purple-400">payments</span>
                            <h3 className="text-lg font-bold text-[#F8FAFC]">Pricing Section</h3>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-slate-300">Pricing Title</Label>
                            <Input
                                name="pricingTitle"
                                value={formData.pricingTitle}
                                onChange={handleChange}
                                className="bg-[#111827] border-[#2A344A] text-white focus:border-[#10B981]"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-slate-300">Pricing Description</Label>
                            <Textarea
                                name="pricingDescription"
                                value={formData.pricingDescription}
                                onChange={handleChange}
                                className="bg-[#111827] border-[#2A344A] text-white focus:border-[#10B981]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
