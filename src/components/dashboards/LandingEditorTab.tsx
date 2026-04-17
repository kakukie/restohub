'use client'

import { useState } from 'react'
import { useAppStore, LandingPageData } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

export default function LandingEditorTab() {
    const { helpdeskSettings, updateHelpdeskSettings, subscriptionPlans, updateSubscriptionPlan } = useAppStore()

    // Plan editing state
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
    const [planForm, setPlanForm] = useState<any>({})

    // Local state for the form so we can save it explicitly
    const [formData, setFormData] = useState<LandingPageData>(
        helpdeskSettings.landingPageData || {
            heroTitle: 'Modern Menu Ecosystem',
            heroSubtitle: 'Update v3.2: Mobile Experience Optimized',
            heroDescription: 'Solusi lengkap manajemen restoran. Kelola stok, pantau pesanan secara offline, dan sinkronisasi data otomatis dengan Meenuin.',
            statsMerchants: '500+',
            statsOrders: '120k+',
            statsUptime: '99.9%',
            feature1Title: 'Manajemen Stok',
            feature1Desc: 'Pantau stok produk secara real-time. Hindari kehabisan stok saat jam sibuk dengan sistem peringatan otomatis.',
            feature2Title: 'Mode Offline',
            feature2Desc: 'Tetap bisa mencatat pesanan meskipun koneksi internet terputus. Data akan tersimpan aman di perangkat Anda.',
            feature3Title: 'Sinkronisasi Data',
            feature3Desc: 'Semua data transaksi akan disinkronkan secara otomatis saat koneksi kembali stabil. Tanpa kehilangan data.',
            pricingTitle: 'Simple, Transparent Pricing',
            pricingDescription: 'Pilih paket yang paling sesuai untuk restoran Anda. Tanpa biaya tersembunyi, batalkan kapan saja.',
            contactTitle: 'Hubungi Kami',
            contactWhatsappText: 'Tanya via WhatsApp',
            contactWhatsappDesc: 'CS kami siap menjawab semua pertanyaan Anda.',
            contactEmailText: 'Kirim Email',
            contactEmailDesc: 'Punya pertanyaan spesifik? Email kami kapan saja.'
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

    const handleEditPlan = (plan: any) => {
        setEditingPlanId(plan.id)
        setPlanForm({
            name: plan.name,
            price: plan.price,
            features: plan.features.join('\n')
        })
    }

    const handleSavePlan = async () => {
        if (!editingPlanId) return

        const updates = {
            name: planForm.name,
            price: Number(planForm.price),
            features: planForm.features.split('\n').filter((f: string) => f.trim() !== '')
        }

        try {
            const res = await fetch('/api/subscription-plans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingPlanId, ...updates })
            })
            const data = await res.json()
            if (data.success) {
                updateSubscriptionPlan(editingPlanId, updates)
                toast({ title: "Plan Updated", description: `Paket ${updates.name} berhasil diperbarui.` })
                setEditingPlanId(null)
            }
        } catch (error) {
            toast({ title: "Error", description: "Gagal menyimpan perubahan paket.", variant: "destructive" })
        }
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

                        {/* Subscription Plans Card Editor */}
                        <div className="space-y-4 pt-4 border-t border-[#2A344A]">
                            <Label className="text-slate-300 font-bold uppercase text-[10px] tracking-wider">Plan Card Details</Label>
                            <div className="grid grid-cols-1 gap-4">
                                {subscriptionPlans.map((plan) => (
                                    <div key={plan.id} className="bg-[#111827] border border-[#2A344A] p-4 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-emerald-400">{plan.id} Plan</h4>
                                            {editingPlanId === plan.id ? (
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={handleSavePlan} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-[10px]">Save</Button>
                                                    <Button size="sm" variant="outline" onClick={() => setEditingPlanId(null)} className="h-8 text-[10px] border-[#2A344A] text-slate-400">Cancel</Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="ghost" onClick={() => handleEditPlan(plan)} className="h-8 text-[10px] text-slate-500 hover:text-white">Edit</Button>
                                            )}
                                        </div>

                                        {editingPlanId === plan.id ? (
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-slate-500">Display Name</Label>
                                                        <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="bg-[#0B0F1A] border-[#2A344A] text-white h-8 text-xs" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-slate-500">Price (Monthly)</Label>
                                                        <Input type="number" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} className="bg-[#0B0F1A] border-[#2A344A] text-white h-8 text-xs" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-500">Features (One per line)</Label>
                                                    <Textarea value={planForm.features} onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })} className="bg-[#0B0F1A] border-[#2A344A] text-white text-xs min-h-[80px]" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <p className="text-slate-500">Name</p>
                                                    <p className="text-white font-medium">{plan.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Price</p>
                                                    <p className="text-white font-medium">Rp {plan.price.toLocaleString()}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-slate-500">Features</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {plan.features.slice(0, 3).map((f: string, idx: number) => (
                                                            <span key={idx} className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px]">{f}</span>
                                                        ))}
                                                        {plan.features.length > 3 && <span className="text-slate-500 text-[9px]">+{plan.features.length - 3} more</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Section Edit */}
                    <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-3xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-[#2A344A] pb-4">
                            <span className="material-symbols-outlined text-emerald-400">contact_support</span>
                            <h3 className="text-lg font-bold text-[#F8FAFC]">Contact Section</h3>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-slate-300">Contact Section Title</Label>
                            <Input
                                name="contactTitle"
                                value={formData.contactTitle || ''}
                                onChange={handleChange}
                                className="bg-[#111827] border-[#2A344A] text-white focus:border-[#10B981]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300 text-xs">WhatsApp View Text</Label>
                                <Input name="contactWhatsappText" value={formData.contactWhatsappText || ''} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white h-9" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300 text-xs">WhatsApp Description</Label>
                                <Input name="contactWhatsappDesc" value={formData.contactWhatsappDesc || ''} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white h-9" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300 text-xs">Email View Text</Label>
                                <Input name="contactEmailText" value={formData.contactEmailText || ''} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white h-9" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300 text-xs">Email Description</Label>
                                <Input name="contactEmailDesc" value={formData.contactEmailDesc || ''} onChange={handleChange} className="bg-[#111827] border-[#2A344A] text-white h-9" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
