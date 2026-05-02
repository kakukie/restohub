'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin, Truck, CheckCircle2, Clock, Package, Phone, ArrowLeft, Share2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function OrderTrackingPage() {
    const params = useParams()
    const orderId = params.id as string
    const [order, setOrder] = useState<any>(null)
    const [tracking, setTracking] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

    const handleShare = () => {
        if (typeof navigator !== 'undefined') {
            const url = window.location.href;
            if (navigator.share) {
                navigator.share({
                    title: `Lacak Pesanan #${order?.orderNumber}`,
                    text: `Pantau pengiriman pesanan saya di RestoHub`,
                    url: url
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(url);
                toast({ title: "Link Disalin", description: "Simpan link ini untuk melacak pesanan Anda nanti." });
            }
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Order Basic Info
                const orderRes = await fetch(`/api/orders/${orderId}`)
                const orderData = await orderRes.json()
                if (orderData.success) {
                    setOrder(orderData.data)
                } else {
                    setError('Pesanan tidak ditemukan')
                    return
                }

                // Fetch Real-time Tracking from Biteship
                const trackingRes = await fetch(`/api/shipping/track/${orderId}`)
                const trackingData = await trackingRes.json()
                if (trackingData.success) {
                    setTracking(trackingData.data)
                    setLastUpdated(new Date())
                }
            } catch (err) {
                console.error('Tracking fetch error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 45000) // Refresh every 45s
        return () => clearInterval(interval)
    }, [orderId])

    if (loading && !order) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
            <p className="text-slate-500 font-medium">Menghubungkan ke satelit kurir...</p>
        </div>
    )

    if (error || !order) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-full mb-4">
                <Package className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Waduh!</h1>
            <p className="text-slate-500 mb-6">{error || 'Pesanan tidak ditemukan.'}</p>
            <Button asChild variant="outline" className="rounded-xl">
                <Link href="/">Kembali ke Beranda</Link>
            </Button>
        </div>
    )

    // Map internal status to display status
    const getDisplayStatus = () => {
        if (tracking?.status) {
            const s = tracking.status.toLowerCase();
            if (s === 'delivered') return 'DELIVERED';
            if (s === 'on_the_way' || s === 'picked_up' || s === 'dropping_off') return 'ON_THE_WAY';
            if (s === 'allocated' || s === 'picking_up') return 'PICKUP';
            if (s === 'confirmed' || s === 'ready_to_ship') return 'CONFIRMED';
        }
        return order.shippingStatus || 'PENDING';
    }

    const statusSteps = [
        { key: 'PENDING', label: 'Menunggu Konfirmasi', icon: Clock },
        { key: 'CONFIRMED', label: 'Pesanan Diproses', icon: Package },
        { key: 'PICKUP', label: 'Kurir Menuju Resto', icon: Truck },
        { key: 'ON_THE_WAY', label: 'Dalam Perjalanan', icon: Truck },
        { key: 'DELIVERED', label: 'Sudah Sampai', icon: CheckCircle2 }
    ]

    const getEstimatedTime = () => {
        if (!order) return 'Menghitung...';
        
        const code = (order.courierCode || '').toLowerCase();
        const service = (order.courierService || '').toLowerCase();

        if (['gojek', 'grab'].includes(code)) {
            if (service.includes('instant')) return 'Sekitar 1-2 Jam';
            if (service.includes('same')) return 'Sekitar 6-8 Jam';
            return 'Sekitar 20-30 Menit'; // Default fallback for on-demand
        }
        
        if (['jne', 'jnt', 'sicepat', 'anteraja', 'ninja'].includes(code)) {
            if (service.includes('yes') || service.includes('best') || service.includes('ons')) return '1 Hari Kerja';
            return '2-3 Hari Kerja';
        }

        return 'Dalam Pengiriman';
    };

    const displayStatus = getDisplayStatus();
    const activeIndex = statusSteps.findIndex(s => s.key === displayStatus)
    
    // Determine if we should show the map (Gojek/Grab)
    const isOnDemand = ['gojek', 'grab'].includes((order.courierCode || '').toLowerCase())
    const courierInfo = tracking?.courier || {};

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 px-4 py-4 sticky top-0 z-20">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href={`/menu/${order.restaurantId}`}><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div className="text-center">
                        <h1 className="font-black text-sm uppercase tracking-tighter">Lacak Pengiriman</h1>
                        <p className="text-[10px] text-slate-500 font-bold">#{order.orderNumber}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
                        <Share2 className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <main className="max-w-md mx-auto p-4 space-y-4">
                {/* Live Map Section */}
                {isOnDemand && activeIndex >= 2 && activeIndex < 4 && (
                    <Card className="border-none shadow-2xl overflow-hidden dark:bg-slate-900 h-64 relative rounded-3xl ring-1 ring-black/5">
                        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                            <img 
                                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800" 
                                alt="Live Map" 
                                className="w-full h-full object-cover opacity-60 grayscale brightness-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            
                            {/* Animated Pulse for Driver Location */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="relative">
                                    <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                                    <div className="relative bg-emerald-600 p-2 rounded-full shadow-2xl border-2 border-white">
                                        <Truck className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="mt-2 bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-lg border border-slate-100 dark:border-slate-800 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Kurir Sedang Jalan</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-2xl border border-white/20 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                        {order.courierCode?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase">{courierInfo.name || 'Driver ' + (order.courierCode || 'Biteship')}</p>
                                        <p className="text-[10px] text-slate-500 font-bold">{courierInfo.phone || '0812-XXXX-XXXX'}</p>
                                    </div>
                                </div>
                                <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700" asChild>
                                    <a href={`tel:${courierInfo.phone || '08123456789'}`}><Phone className="h-4 w-4" /></a>
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Order Summary */}
                <Card className="border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900 rounded-3xl ring-1 ring-black/5">
                    <CardContent className="p-0">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Estimasi Tiba</p>
                                    <h2 className="text-2xl font-black tracking-tight">
                                        {displayStatus === 'DELIVERED' ? 'Sudah Sampai!' : getEstimatedTime()}
                                    </h2>
                                </div>
                                <Badge className="bg-white/20 text-white border-none backdrop-blur-md px-3 py-1 font-black text-[10px] uppercase">
                                    {displayStatus}
                                </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                                <div className="flex-1">
                                    <p className="text-emerald-200 text-[10px] font-black uppercase mb-1 opacity-70">Kurir & Layanan</p>
                                    <p className="text-sm font-bold capitalize flex items-center gap-2">
                                        <Truck className="h-4 w-4" /> {order.courierCode || 'Biteship'} {order.courierService}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-200 text-[10px] font-black uppercase mb-1 opacity-70">Status</p>
                                    <p className="text-sm font-bold uppercase">{displayStatus}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Sharing Options */}
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <Button 
                                    variant="outline" 
                                    className="rounded-2xl h-12 text-[10px] font-black uppercase border-slate-200 dark:border-slate-800 gap-2"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4 text-emerald-600" /> Share Link
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="rounded-2xl h-12 text-[10px] font-black uppercase border-slate-200 dark:border-slate-800 gap-2"
                                    onClick={() => {
                                        const url = window.location.href;
                                        navigator.clipboard.writeText(url);
                                        toast({ title: "Link Disalin", description: "Bagikan link ini ke pelanggan." });
                                    }}
                                >
                                    <Package className="h-4 w-4 text-emerald-600" /> Salin Link
                                </Button>
                            </div>

                            {/* Resi / Tracking ID Section - Always show if available */}
                            {order.biteshipTrackingId ? (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Nomor Resi / Waybill</p>
                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none text-[10px]">AKTIF</Badge>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-xl font-mono font-black tracking-tighter text-slate-900 dark:text-white">
                                            {order.biteshipTrackingId}
                                        </p>
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs gap-2"
                                            onClick={() => {
                                                navigator.clipboard.writeText(order.biteshipTrackingId)
                                                toast({ title: "Berhasil", description: "Nomor resi telah disalin." })
                                            }}
                                        >
                                            Salin
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 italic font-medium">Gunakan nomor ini untuk melacak di website resmi kurir.</p>
                                </div>
                            ) : (
                                !isOnDemand && displayStatus !== 'PENDING' && (
                                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                                        <p className="text-[10px] font-black uppercase text-amber-600 mb-1">Informasi Resi</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Nomor resi akan muncul setelah kurir memproses paket Anda.</p>
                                    </div>
                                )
                            )}

                            <div className="flex items-start gap-3 pt-2">
                                <div className="mt-1 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <MapPin className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Alamat Pengiriman</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                        {order.deliveryAddress || 'Alamat tidak tersedia'}
                                    </p>
                                </div>
                            </div>
                            
                            {order.biteshipTrackingId && (
                                <Button className="w-full bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl h-12 font-black uppercase tracking-tight shadow-lg" asChild>
                                    <a 
                                        href={
                                            (order.courierCode || '').toLowerCase() === 'jne' ? `https://www.jne.co.id/id/tracking/trace` :
                                            (order.courierCode || '').toLowerCase() === 'jnt' ? `https://jet.co.id/track` :
                                            (order.courierCode || '').toLowerCase() === 'sicepat' ? `https://www.sicepat.com/check-resi` :
                                            `https://cekresi.com/?noresi=${order.biteshipTrackingId}`
                                        } 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        Cek di Website Resmi
                                    </a>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Progress Tracker with Real History */}
                <Card className="border-none shadow-xl dark:bg-slate-900 rounded-3xl ring-1 ring-black/5 overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800 px-6 py-4">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-emerald-600" /> Riwayat Perjalanan
                            </div>
                            <span className="opacity-60">Update: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="relative space-y-8">
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                            
                            {/* Real Biteship History if available, else standard steps */}
                            {tracking?.history && tracking.history.length > 0 ? (
                                tracking.history.slice().reverse().map((h: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-4 relative z-10">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${
                                            idx === 0 ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                                        }`}>
                                            {idx === 0 ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-400"></div>}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${idx === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {h.note || h.status}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                                {new Date(h.updated_at || h.timestamp).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                statusSteps.map((step, idx) => {
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
                                                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Status terbaru sedang diproses...</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Driver Info Overlay */}
                {(courierInfo.name || isOnDemand) && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
                                {courierInfo.name ? (
                                    <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white font-black">
                                        {courierInfo.name.charAt(0)}
                                    </div>
                                ) : (
                                    <Truck className="h-6 w-6 text-emerald-600" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase">{courierInfo.name || (order.courierCode || 'Kurir') + ' Partner'}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{courierInfo.phone || 'Kontak Kurir'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" variant="outline" className="rounded-xl" asChild>
                                <a href={`tel:${courierInfo.phone || '08123456789'}`}><Phone className="h-4 w-4" /></a>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Help Section */}
                <div className="text-center py-10">
                    <p className="text-[10px] text-slate-400 mb-3 font-black uppercase tracking-widest">Butuh bantuan?</p>
                    <div className="flex justify-center gap-3">
                        <Button variant="outline" className="rounded-2xl h-10 px-6 text-xs font-black uppercase border-slate-200 dark:border-slate-800" asChild>
                            <a 
                                href={`https://wa.me/${(() => {
                                    const phone = order.restaurant?.phone || '6282111100344';
                                    let cleaned = phone.replace(/\D/g, '');
                                    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
                                    if (cleaned.startsWith('8')) cleaned = '62' + cleaned;
                                    return cleaned;
                                })()}?text=Halo ${order.restaurant?.name || 'Resto'}, saya ingin tanya status pesanan #${order.orderNumber}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                            >
                                Chat Restoran
                            </a>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}
