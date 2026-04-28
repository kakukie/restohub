'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin, Truck, CheckCircle2, Clock, Package, Phone, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function OrderTrackingPage() {
    const params = useParams()
    const orderId = params.id as string
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`)
                const data = await res.json()
                if (data.success) {
                    setOrder(data.data)
                } else {
                    setError('Order not found')
                }
            } catch (err) {
                setError('Failed to load order')
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
        const interval = setInterval(fetchOrder, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [orderId])

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
            <p className="text-slate-500 font-medium">Memuat status pengiriman...</p>
        </div>
    )

    if (error || !order) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-full mb-4">
                <Package className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Oops!</h1>
            <p className="text-slate-500 mb-6">{error || 'Pesanan tidak ditemukan.'}</p>
            <Button asChild variant="outline">
                <Link href="/">Kembali ke Beranda</Link>
            </Button>
        </div>
    )

    const statusSteps = [
        { key: 'PENDING', label: 'Menunggu Konfirmasi', icon: Clock, color: 'text-amber-500' },
        { key: 'CONFIRMED', label: 'Pesanan Diproses', icon: Package, color: 'text-blue-500' },
        { key: 'PICKUP', label: 'Kurir Menuju Restoran', icon: Truck, color: 'text-indigo-500' },
        { key: 'ON_THE_WAY', label: 'Dalam Perjalanan', icon: Truck, color: 'text-emerald-500' },
        { key: 'DELIVERED', label: 'Sudah Sampai', icon: CheckCircle2, color: 'text-green-600' }
    ]

    const currentStatus = order.shippingStatus || 'PENDING'
    const activeIndex = statusSteps.findIndex(s => s.key === currentStatus)
    
    // Determine if we should show the map (Gojek/Grab)
    const isOnDemand = ['gojek', 'grab'].includes((order.courierCode || '').toLowerCase())

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/menu/${order.restaurantId}`}><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <h1 className="font-bold text-lg">Status Pengiriman</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <main className="max-w-md mx-auto p-4 space-y-4">
                {/* Simulated Map for Gojek/Grab */}
                {isOnDemand && activeIndex >= 2 && activeIndex < 4 && (
                    <Card className="border-none shadow-sm overflow-hidden dark:bg-slate-900 h-48 relative">
                        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                            <img 
                                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=600" 
                                alt="Simulated Map" 
                                className="w-full h-full object-cover opacity-50"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900 dark:text-white bg-black/10">
                                <MapPin className="h-8 w-8 text-red-600 animate-bounce mb-2" />
                                <p className="text-xs font-black uppercase tracking-tighter">Lokasi Kurir (Simulasi)</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Order Summary */}
                <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-wider mb-1">Nomor Pesanan</p>
                                <h2 className="text-xl font-black tracking-tight">#{order.orderNumber}</h2>
                            </div>
                            <Badge className="bg-white/20 text-white border-none backdrop-blur-sm px-3 py-1 font-bold">
                                {order.status}
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/10 pt-4">
                            <div>
                                <p className="text-emerald-200 text-[10px] font-bold uppercase mb-1">Kurir</p>
                                <p className="text-sm font-bold capitalize">{order.courierCode || 'Biteship'} - {order.courierService || 'Standard'}</p>
                            </div>
                            {order.biteshipTrackingId && (
                                <div>
                                    <p className="text-emerald-200 text-[10px] font-bold uppercase mb-1">Nomor Resi</p>
                                    <p className="text-sm font-mono font-bold tracking-wider">{order.biteshipTrackingId}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-emerald-50 mt-4 text-xs opacity-80 italic">
                            <MapPin className="h-3.5 w-3.5" />
                            <p className="truncate">{order.deliveryAddress || 'Alamat tidak tersedia'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress Tracker */}
                <Card className="border-none shadow-sm dark:bg-slate-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-emerald-600" /> Melacak Pesanan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="relative space-y-8">
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                            
                            {statusSteps.map((step, idx) => {
                                const isCompleted = idx < activeIndex
                                const isActive = idx === activeIndex
                                
                                return (
                                    <div key={step.key} className="flex items-start gap-4 relative z-10">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${
                                            isCompleted ? 'bg-emerald-600' : (isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-700')
                                        }`}>
                                            {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-slate-400'}`}></div>}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : (isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400')}`}>
                                                {step.label}
                                            </p>
                                            {isActive && (
                                                <p className="text-[10px] text-slate-500 mt-1 font-medium">Status diperbarui {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Driver Info */}
                {activeIndex >= 2 && (
                    <Card className="border-none shadow-sm dark:bg-slate-900 overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            Informasi Kurir
                        </div>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                    <Truck className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-black capitalize">{order.courierCode || 'Kurir Biteship'}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{order.courierService || 'Standard Service'}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Driver: {order.courierCode === 'gojek' ? 'Budi Santoso' : 'Agus Kurniawan'}</p>
                                </div>
                            </div>
                            <Button size="icon" variant="outline" className="rounded-2xl dark:border-slate-700 shadow-sm" asChild>
                                <a href="tel:08123456789">
                                    <Phone className="h-4 w-4" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Footer Info */}
                <div className="text-center py-6">
                    <p className="text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-wider">Punya pertanyaan tentang pesanan Anda?</p>
                    <Button variant="link" className="text-emerald-600 dark:text-emerald-500 h-auto p-0 text-xs font-black uppercase tracking-tight" asChild>
                        <a href="https://wa.me/6282111100344" target="_blank" rel="noopener noreferrer">
                            Hubungi Bantuan
                        </a>
                    </Button>
                </div>
            </main>
        </div>
    )
}
