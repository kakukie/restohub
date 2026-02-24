'use client'

import { Wallet, QrCode, Banknote } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface PaymentMethod {
    id: string
    type: string
    isActive: boolean
}

interface PaymentMethodsProps {
    methods: PaymentMethod[]
    onToggle: (id: string, isActive: boolean) => void
    onEdit: (method: PaymentMethod) => void
    onDelete: (id: string) => void
}

export default function PaymentMethods({ methods, onToggle, onEdit, onDelete }: PaymentMethodsProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'OVO': return <Wallet className="h-6 w-6 text-purple-600" />
            case 'QRIS': return <QrCode className="h-6 w-6 text-blue-600" />
            case 'CASH': return <Banknote className="h-6 w-6 text-emerald-600" />
            default: return <Wallet className="h-6 w-6 text-slate-600" />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'OVO': return 'bg-purple-100 dark:bg-purple-500/10'
            case 'QRIS': return 'bg-blue-100 dark:bg-blue-500/10'
            case 'CASH': return 'bg-emerald-100 dark:bg-emerald-500/10'
            default: return 'bg-slate-100 dark:bg-slate-800'
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment Methods</h2>
            <div className="grid grid-cols-1 gap-4">
                {methods.map((method) => (
                    <div
                        key={method.id}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group transition-colors hover:border-emerald-500/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${getBgColor(method.type)} rounded-xl flex items-center justify-center`}>
                                {getIcon(method.type)}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">{method.type}</p>
                                {(method as any).accountNumber && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {(method as any).accountNumber}
                                        {(method as any).accountName && ` - ${(method as any).accountName}`}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Switch
                                checked={method.isActive}
                                onCheckedChange={(checked) => onToggle(method.id, checked)}
                            />
                            <div className="flex gap-2 transition-opacity">
                                <button
                                    onClick={() => onEdit(method)}
                                    className="text-slate-500 hover:text-blue-500 transition-colors"
                                >
                                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Edit</span>
                                </button>
                                <button
                                    onClick={() => onDelete(method.id)}
                                    className="text-slate-500 hover:text-red-500 transition-colors"
                                >
                                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {methods.length === 0 && (
                    <div className="text-slate-500 text-sm">No payment methods configured.</div>
                )}
            </div>
        </div>
    )
}
