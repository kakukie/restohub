'use client'

interface BestSellerItem {
    id: string
    name: string
    price: number
    imageUrl?: string
    soldCount: number
}

interface BestSellersProps {
    items: BestSellerItem[]
}

export default function BestSellers({ items }: BestSellersProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Best Sellers</h2>
            </div>
            <div className="space-y-4">
                {items.slice(0, 5).map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate text-sm text-slate-900 dark:text-white">{item.name}</h4>
                            <p className="text-xs text-slate-500">{item.soldCount} sold this week</p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-500 font-bold text-sm">
                                Rp {item.price?.toLocaleString('id-ID') || 0}
                            </p>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-slate-500 text-sm">No best sellers yet. Mark items as &quot;Best Seller&quot; in Menu.</div>
                )}
            </div>
        </div>
    )
}
