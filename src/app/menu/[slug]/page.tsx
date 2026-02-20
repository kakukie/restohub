'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAppStore, MenuItem } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Minus, Plus, ShoppingCart, ShoppingBag, Search, Info, Clock, MapPin, Phone, Star, User, Home, LayoutGrid, CheckCircle, CreditCard, ChevronDown, ChevronUp, Loader2, ArrowLeft, Trash2, QrCode, Download, Flame, ThumbsUp, Utensils, Coffee, Cake, Cookie } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'

// Defined themes
const themeConfig = {
    'modern-emerald': {
        primary: 'bg-emerald-600',
        primaryHover: 'hover:bg-emerald-700',
        textPrimary: 'text-emerald-600',
        bgLight: 'bg-emerald-50',
        bgLightHover: 'hover:bg-emerald-100',
        textLight: 'text-emerald-100',
        textDark: 'text-emerald-700',
        border: 'border-emerald-600',
        gradient: 'from-emerald-600 to-teal-600',
        badge: 'bg-emerald-100 text-emerald-700'
    },
    'classic-orange': {
        primary: 'bg-orange-600',
        primaryHover: 'hover:bg-orange-700',
        textPrimary: 'text-orange-600',
        bgLight: 'bg-orange-50',
        bgLightHover: 'hover:bg-orange-100',
        textLight: 'text-orange-100',
        textDark: 'text-orange-800',
        border: 'border-orange-600',
        gradient: 'from-orange-600 to-red-600',
        badge: 'bg-orange-100 text-orange-800'
    },
    'minimal-blue': {
        primary: 'bg-slate-900',
        primaryHover: 'hover:bg-slate-800',
        textPrimary: 'text-slate-900',
        bgLight: 'bg-slate-100',
        bgLightHover: 'hover:bg-slate-200',
        textLight: 'text-slate-300',
        textDark: 'text-slate-800',
        border: 'border-slate-900',
        gradient: 'from-slate-900 to-slate-800',
        badge: 'bg-slate-100 text-slate-900'
    }
}

export default function PublicMenuPage() {
    const params = useParams()
    const slug = decodeURIComponent(params.slug as string)

    // Global Store
    const restaurants = useAppStore(state => state.restaurants)
    const menuItems = useAppStore(state => state.menuItems)
    const cart = useAppStore(state => state.cart)
    const addToCart = useAppStore(state => state.addToCart)
    const updateCartItemQuantity = useAppStore(state => state.updateCartItemQuantity)
    const removeFromCart = useAppStore(state => state.removeFromCart)
    const clearCart = useAppStore(state => state.clearCart)

    // Local State
    const [mounted, setMounted] = useState(false)
    const [restaurant, setRestaurant] = useState<any>(null)
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    // Order Type State (New)
    const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN')

    // Checkout states
    const [cartDialogOpen, setCartDialogOpen] = useState(false)
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false)
    const [guestName, setGuestName] = useState('')
    const [guestPhone, setGuestPhone] = useState('')
    const [tableNumber, setTableNumber] = useState('')
    const [notes, setNotes] = useState('')
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
    const [processingPayment, setProcessingPayment] = useState(false)
    const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false)
    const [completedOrder, setCompletedOrder] = useState<any>(null)

    // Refs for scrolling
    const categoryScrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        const loadData = async () => {
            // 1. Try local store first
            let existingResto = restaurants.find(r =>
                (r.slug && r.slug.toLowerCase() === slug.toLowerCase()) ||
                r.id === slug
            )

            if (existingResto) {
                setRestaurant(existingResto)
                const existingMenu = menuItems.filter(m => m.restaurantId === existingResto.id && m.isAvailable)
                if (existingMenu.length > 0) setMenu(existingMenu)
                setIsLoading(false)
            } else {
                setIsLoading(true)
            }

            // 2. Fetch fresh data
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            try {
                const res = await fetch(`/api/restaurants/${encodeURIComponent(slug)}`, {
                    signal: controller.signal,
                    cache: 'no-store' // Ensure fresh data for Theme Sync
                })
                clearTimeout(timeoutId)
                const data = await res.json()

                if (data.success && data.data) {
                    setRestaurant(data.data)
                    const apiMenu = data.data.menuItems || []
                    setMenu(apiMenu)
                }
            } catch (error) {
                console.error("Failed to load restaurant", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, slug])

    // Derived State
    const categories = ['all', ...Array.from(new Set(menu.map(m => m.categoryName || 'Other')))]
    const bestSellers = menu.filter(m => m.isBestSeller)

    // Theme Logic
    const currentTheme = restaurant?.theme
        ? (themeConfig[restaurant.theme as keyof typeof themeConfig] || themeConfig['modern-emerald'])
        : themeConfig['modern-emerald']

    // Filtering
    const filteredMenu = menu.filter(m => {
        const matchesCategory = selectedCategory === 'all' || (m.categoryName || 'Other') === selectedCategory
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.description?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Handlers
    const handleAddToCart = (item: any) => {
        addToCart({
            menuItemId: item.id,
            menuItemName: item.name,
            price: item.price,
            quantity: 1,
            image: item.image,
            categoryName: item.categoryName
        })
        toast({ title: 'Added to cart', description: `${item.name} added successfully` })
    }

    const processOrder = async () => {
        if (!selectedPaymentMethod) {
            toast({ title: 'Payment Required', description: 'Please select a payment method', variant: 'destructive' })
            return
        }
        if (!guestName) {
            toast({ title: 'Name Required', description: 'Please enter your name', variant: 'destructive' })
            return
        }

        setProcessingPayment(true)

        try {
            const orderPayload = {
                restaurantId: restaurant?.id,
                customerName: guestName,
                customerPhone: guestPhone,
                tableNumber: orderType === 'DINE_IN' ? tableNumber : 'TAKEAWAY',
                notes: `[${orderType}] ${notes}`,
                paymentMethod: selectedPaymentMethod,
                items: cart.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: item.price,
                    notes: ''
                })),
                totalAmount: cartTotal
            }

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Failed to place order')
            }

            setCompletedOrder(data.data)
            setCheckoutDialogOpen(false)
            setOrderConfirmationOpen(true)
            clearCart()
            toast({ title: 'Order Placed!', description: 'Your order has been sent.' })
        } catch (error: any) {
            console.error("Order failed", error)
            toast({ title: 'Order Failed', description: error.message, variant: 'destructive' })
        } finally {
            setProcessingPayment(false)
        }
    }

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            </div>
        )
    }

    if (!restaurant) return <div className="p-10 text-center">Restaurant Not Found</div>

    return (
        <div className="min-h-screen bg-gray-100 pb-32">

            {/* 1. Sticky Header - Gacoan Style */}
            <header className="sticky top-0 z-40 bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Back Button (optional logic) */}
                    <div className="w-8 h-8 flex items-center justify-center">
                        {/* Placeholder for Back */}
                    </div>

                    {/* Centered Logo/Name if possible, or left aligned */}
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg leading-tight truncate max-w-[200px]">{restaurant.name}</h1>
                        <div className="flex items-center text-xs text-gray-500 gap-1">
                            <div className={`w-2 h-2 rounded-full ${restaurant.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            {restaurant.isActive ? 'Open' : 'Closed'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                        <Search className="h-5 w-5 text-gray-700" />
                    </Button>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6 text-gray-700" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>{restaurant.name}</SheetTitle>
                                <SheetDescription>{restaurant.address}</SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold mb-2">Contact Info</h3>
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> {restaurant.phone || '-'}
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                                        <MapPin className="h-4 w-4" /> {restaurant.address || '-'}
                                    </p>
                                    {/* Google Maps Embed */}
                                    {restaurant.googleMapsUrl && (
                                        <div className="mt-4 rounded-lg overflow-hidden border h-48 w-full">
                                            <iframe
                                                src={restaurant.googleMapsUrl.includes('embed')
                                                    ? restaurant.googleMapsUrl
                                                    : `https://www.google.com/maps?q=${encodeURIComponent(restaurant.address)}&output=embed`
                                                }
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                allowFullScreen
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            ></iframe>
                                        </div>
                                    )}
                                    {restaurant.googleMapsUrl && (
                                        <Button variant="outline" className="w-full mt-2" onClick={() => window.open(restaurant.googleMapsUrl, '_blank')}>
                                            <MapPin className="h-4 w-4 mr-2" /> Open in Google Maps
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            {/* Search Bar Collapsible */}
            {isSearchOpen && (
                <div className="bg-white px-4 pb-3 animate-in slide-in-from-top-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search menu..."
                            className="pl-9 bg-gray-50 border-gray-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
            )}

            {/* 2. Banner & Info Card */}
            <div className="relative">
                {/* Banner Image */}
                <div className="h-48 md:h-64 bg-gray-200 relative">
                    {restaurant.banner ? (
                        <img src={restaurant.banner} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        // Fallback Pattern
                        <div className={`w-full h-full bg-gradient-to-r ${currentTheme.gradient} opacity-90 relative overflow-hidden`}>
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <Utensils className="h-32 w-32 text-white" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Card - Overlapping (Disabled by User Request) */}
                {/* 
                <div className="px-4 -mt-16 relative z-10">
                    <Card className="p-4 shadow-lg border-none">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="font-bold text-xl">{restaurant.name}</h2>
                                <p className="text-gray-500 text-sm mt-1">{restaurant.package === 'ENTERPRISE' ? 'Premium Outlet' : 'Restaurant'}</p>
                            </div>
                            {restaurant.logo && (
                                <div className="w-12 h-12 relative rounded-md overflow-hidden bg-gray-100 border">
                                    <Image src={restaurant.logo} alt="Logo" fill className="object-cover" />
                                </div>
                            )}
                        </div>

                        <div className="my-4 h-px bg-gray-100" />

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="h-4 w-4 text-green-600" />
                                <span>15-20 min</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span>4.8 (1.2k)</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>2.5 km</span>
                            </div>
                        </div>
                    </Card>
                </div>
                */}
            </div>

            {/* 3. Order Type Selector */}
            <div className="px-4 mt-6">
                <div className="bg-white p-3 rounded-lg border shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setOrderType(orderType === 'DINE_IN' ? 'TAKEAWAY' : 'DINE_IN')}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${orderType === 'DINE_IN' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {orderType === 'DINE_IN' ? <Utensils className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                        </div>
                        <div className="text-left">
                            <div className="text-xs text-gray-500">Order Method</div>
                            <div className="font-bold text-sm">{orderType === 'DINE_IN' ? 'Dine In / Makan di Tempat' : 'Takeaway / Bungkus'}</div>
                        </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
            </div>

            {/* 4. Sticky Category Tabs */}
            <div className="sticky top-[60px] z-30 bg-gray-100 pt-4 pb-2">
                <div className="w-full overflow-x-auto whitespace-nowrap px-4 pb-2 no-scrollbar">
                    <div className="flex gap-2">
                        {categories.map(cat => {
                            // Dynamic Icon Logic
                            let Icon = Utensils;
                            const lower = cat.toLowerCase();
                            if (lower.includes('minum') || lower.includes('drink') || lower.includes('coffee') || lower.includes('kopi')) Icon = Coffee;
                            else if (lower.includes('dessert') || lower.includes('cake') || lower.includes('manis')) Icon = Cake;
                            else if (lower.includes('promo') || lower.includes('best')) Icon = Star;
                            else if (lower.includes('snack') || lower.includes('cemilan')) Icon = Cookie;
                            else if (lower === 'all') Icon = LayoutGrid;

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`
                                         px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2
                                         ${selectedCategory === cat
                                            ? `bg-gray-900 text-white shadow-md`
                                            : 'bg-white text-gray-600 border hover:bg-gray-50'}
                                     `}
                                >
                                    <Icon className="h-4 w-4" />
                                    {cat === 'all' ? 'All Categories' : cat}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* 5. Menu Grid - Modern Cards */}
            <div className="px-4 py-2 space-y-8">
                {/* Best Sellers & Recommended */}
                {selectedCategory === 'all' && searchQuery === '' && (menu.some(m => m.isBestSeller || m.isRecommended)) && (
                    <section>
                        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <ThumbsUp className="h-5 w-5 text-orange-500 fill-orange-500" /> Recommended For You
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {menu.filter(m => m.isBestSeller || m.isRecommended).map(item => (
                                <Card key={item.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => handleAddToCart(item)}>
                                    <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-400"><Utensils className="h-8 w-8 opacity-20" /></div>
                                        )}
                                        {/* Dynamic Badge */}
                                        {item.isBestSeller && (
                                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-orange-600 shadow-sm">
                                                BEST SELLER
                                            </div>
                                        )}
                                        {!item.isBestSeller && item.isRecommended && (
                                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-emerald-600 shadow-sm">
                                                RECOMMENDED
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                                        <p className="text-emerald-700 font-bold text-sm mt-1">Rp {item.price.toLocaleString()}</p>
                                        <div className="flex items-end justify-between mt-2">
                                            <span className="text-[10px] text-gray-500">
                                                {item.isBestSeller ? 'Most Loved' : 'Chef Pick'}
                                            </span>
                                            <div className={`h-6 w-6 rounded-full ${currentTheme.primary} flex items-center justify-center text-white`}>
                                                <Plus className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Main List */}
                <section>
                    {/* Only show header if filtered */}
                    {(selectedCategory !== 'all' || searchQuery !== '') && (
                        <h3 className="font-bold text-lg mb-3">
                            {searchQuery ? `Search: "${searchQuery}"` : selectedCategory}
                        </h3>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {filteredMenu.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400"><Utensils className="h-6 w-6 opacity-20" /></div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-base">{item.name}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description || 'No description available'}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="font-bold text-emerald-700">Rp {item.price.toLocaleString()}</span>
                                        <Button size="sm" className={`h-8 px-4 rounded-full ${currentTheme.primary} ${currentTheme.primaryHover} shadow-sm`} onClick={() => handleAddToCart(item)}>
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredMenu.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                No items found.
                            </div>
                        )}
                    </div>
                </section>
            </div>


            {/* Floating Cart & Checkout - Same as before but polished */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-40">
                    <div className="bg-black text-white rounded-xl shadow-2xl p-4 flex items-center justify-between cursor-pointer ring-2 ring-white/50" onClick={() => setCartDialogOpen(true)}>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-300">{cartItemCount} items selected</span>
                            <span className="font-bold text-lg">Rp {cartTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                            <span className="text-sm font-semibold">Checkout</span>
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            )}

            {/* Dialogs (Keep existing logic mostly, just ensuring themes apply) */}
            <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Your Order</DialogTitle>
                        <DialogDescription>Type: {orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway'}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[50vh] pr-4">
                        <div className="space-y-4 pt-2">
                            {cart.map(item => (
                                <div key={item.menuItemId} className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-sm">{item.menuItemName}</h4>
                                        <p className="text-xs text-gray-500">{item.categoryName}</p>
                                        <p className="text-sm font-bold text-emerald-600 mt-1">Rp {(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => removeFromCart(item.menuItemId)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                            <button onClick={() => updateCartItemQuantity(item.menuItemId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm disabled:opacity-50">
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateCartItemQuantity(item.menuItemId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm">
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="border-t pt-4">
                        <Button className={`w-full ${currentTheme.primary} ${currentTheme.primaryHover}`} onClick={() => { setCartDialogOpen(false); setCheckoutDialogOpen(true) }}>
                            Checkout (Rp {cartTotal.toLocaleString()})
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Complete Order</DialogTitle>
                        <DialogDescription>{restaurant?.name}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                            <span className="text-sm">Total Payment</span>
                            <span className="font-bold text-lg text-emerald-600">Rp {cartTotal.toLocaleString()}</span>
                        </div>

                        <div className="space-y-3">
                            <Label>Your Name</Label>
                            <Input placeholder="John Doe" value={guestName} onChange={e => setGuestName(e.target.value)} />

                            <Label>WhatsApp Number</Label>
                            <Input placeholder="08..." value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />

                            {orderType === 'DINE_IN' && (
                                <>
                                    <Label>Table Number</Label>
                                    <Input placeholder="e.g. 12" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
                                </>
                            )}

                            <Label>Notes</Label>
                            <Input placeholder="Extra spicy..." value={notes} onChange={e => setNotes(e.target.value)} />

                            <Label>Payment Method</Label>
                            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(restaurant?.paymentMethods || [])
                                        .filter((m: any) => m.isActive)
                                        .map((m: any) => (
                                            <SelectItem key={m.id} value={m.type}>{m.type}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>

                            {/* QR Code Logic */}
                            {selectedPaymentMethod && selectedPaymentMethod !== 'CASH' && (
                                <div className="bg-white border rounded-lg p-4 flex flex-col items-center">
                                    <p className="text-sm font-bold mb-2">Scan to Pay ({selectedPaymentMethod})</p>

                                    {(() => {
                                        const method = restaurant?.paymentMethods?.find((m: any) => m.type === selectedPaymentMethod)
                                        const qrImage = method?.qrCode

                                        return (
                                            <>
                                                {qrImage ? (
                                                    <div className="relative w-48 h-48 mb-3">
                                                        <img src={qrImage} alt={`QR ${selectedPaymentMethod}`} className="w-48 h-48 object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-100 w-48 h-48 flex items-center justify-center mb-3 rounded">
                                                        <QrCode className="h-16 w-16 text-gray-400" />
                                                        <span className="text-xs text-center text-gray-400 absolute mt-12 px-2">
                                                            No QR for {selectedPaymentMethod}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex gap-2 w-full">
                                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                                                        if (qrImage) {
                                                            const link = document.createElement('a')
                                                            link.href = qrImage
                                                            link.download = `QR_${restaurant.name}_${selectedPaymentMethod}.png`
                                                            document.body.appendChild(link)
                                                            link.click()
                                                            document.body.removeChild(link)
                                                        } else {
                                                            toast({ title: "No QR", description: "No QR image to download for this method", variant: "destructive" })
                                                        }
                                                    }}>
                                                        <Download className="h-4 w-4 mr-2" /> Save QR
                                                    </Button>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>
                            )}

                            {selectedPaymentMethod && selectedPaymentMethod !== 'CASH' && (
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Scan using any e-wallet app.<br />
                                    Upload payment proof if required.
                                </p>
                            )}
                        </div>

                        <Button onClick={processOrder} disabled={processingPayment} className={`w-full ${currentTheme.primary} ${currentTheme.primaryHover} mt-4`}>
                            {processingPayment ? <Loader2 className="animate-spin" /> : 'Confirm Payment & Order'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={orderConfirmationOpen} onOpenChange={setOrderConfirmationOpen}>
                <DialogContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
                        <p className="text-gray-500 mb-6">Your order #{completedOrder?.orderNumber} has been received.</p>
                        <Button onClick={() => setOrderConfirmationOpen(false)} variant="outline">
                            Back to Menu
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div >
    )
}
