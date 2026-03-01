'use client'

import { ShoppingBag, Utensils, QrCode, Wallet, ExternalLink, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Order } from '@/store/app-store'

interface RecentOrdersProps {
    orders: Order[]
    onViewOrder: (order: Order) => void
    onPrintOrder: (order: Order) => void
    onRefresh: () => void
}

export default function RecentOrders({ orders, onViewOrder, onPrintOrder, onRefresh }: RecentOrdersProps) {
    // Filter for active orders mostly, but for now just take recent 5
    const recentOrders = orders.slice(0, 5)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-500'
            case 'CONFIRMED': return 'bg-blue-500/10 text-blue-500'
            case 'PENDING': return 'bg-orange-500/10 text-orange-500'
            case 'CANCELLED': return 'bg-rose-500/10 text-rose-500'
            default: return 'bg-slate-500/10 text-slate-500'
        }
    }

    const getTypeIcon = (isDineIn: boolean) => {
        return isDineIn ? <Utensils className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    Incoming Orders
                    {orders.some(o => o.status === 'PENDING') && (
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                    )}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRefresh}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <RefreshCw className="h-5 w-5 text-slate-500" />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {recentOrders.length === 0 && (
                    <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        No recent orders found.
                    </div>
                )}

                {recentOrders.map((order) => {
                    const isDineIn = !!order.tableNumber && order.tableNumber !== 'TAKEAWAY'
                    return (
                        <div
                            key={order.id}
                            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        {getTypeIcon(isDineIn)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-900 dark:text-white">#{order.orderNumber}</h4>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.customerName} • {isDineIn ? `Dine In (Table ${order.tableNumber})` : 'Take Away'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                                        Rp {order.totalAmount.toLocaleString('id-ID')}
                                    </p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        {order.paymentMethod === 'QRIS' ? <QrCode className="h-3 w-3 text-blue-500" /> : <Wallet className="h-3 w-3 text-purple-500" />}
                                        <span className="text-[10px] font-bold text-slate-400">{order.paymentMethod}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic truncate max-w-[200px]">
                                    {order.items.map(i => `${i.quantity}x ${i.menuItemName}`).join(', ')}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onPrintOrder(order)}
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all"
                                    >
                                        Print
                                    </button>
                                    <button
                                        onClick={() => onViewOrder(order)}
                                        className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
