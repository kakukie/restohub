'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAppStore, MenuItem } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Minus, Plus, ShoppingCart, Search, Info, Clock, MapPin, Phone, Star, User, Home, LayoutGrid, CheckCircle, CreditCard, ChevronDown, ChevronUp, Loader2, ArrowLeft, Trash2, QrCode, Download, Flame, ThumbsUp } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
// PAYMENT_METHODS removed - using dynamic data

const themeConfig = {
    'modern-emerald': {
        primary: 'bg-emerald-600',
        primaryHover: 'hover:bg-emerald-700',
        textPrimary: 'text-emerald-600',
        bgLight: 'bg-emerald-50',
        bgLightHover: 'hover:bg-emerald-100',
        textLight: 'text-emerald-100', // for header description
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
        primary: 'bg-slate-900', // Minimal style uses dark slate/black
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
    const slug = params.slug as string

    const { restaurants, menuItems, addToCart, cart, updateCartItemQuantity, removeFromCart, clearCart, addOrder } = useAppStore()
    const [mounted, setMounted] = useState(false)
    const [restaurant, setRestaurant] = useState<any>(null)
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    const [isLoading, setIsLoading] = useState(true)

    // Checkout states
    const [cartDialogOpen, setCartDialogOpen] = useState(false)
    // ... (keep existing lines)

    useEffect(() => {
        if (!mounted) return

        const loadData = async () => {
            setIsLoading(true)
            try {
                // 1. Try local store first (fastest)
                let existingResto = restaurants.find(r => r.slug === slug || r.id === slug)

                if (existingResto) {
                    setRestaurant(existingResto)
                    const existingMenu = menuItems.filter(m => m.restaurantId === existingResto.id && m.isAvailable)
                    if (existingMenu.length > 0) setMenu(existingMenu)
                    setIsLoading(false) // Show immediately if found locally
                }

                // 2. Fallback to API
                const res = await fetch(`/api/restaurants/${slug}`)
                const data = await res.json()

                if (data.success && data.data) {
                    setRestaurant(data.data)
                    // Ensure menuItems mapping matches
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
    }, [mounted, slug, restaurants, menuItems])

    // Loading state
    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    if (!restaurant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Restaurant Not Found</h2>
                    <p className="text-gray-600 mt-2">Looking for: {slug}</p>
                    <p className="text-gray-500 text-sm mt-4">Available restaurants:</p>
                    <ul className="text-sm text-gray-600 mt-2">
                        {restaurants.map(r => (
                            <li key={r.id}>
                                <a href={`/menu/${r.slug}`} className="text-emerald-600 hover:underline">{r.name} ({r.slug})</a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )
    }

    const categories = ['all', ...Array.from(new Set(menu.map(m => m.categoryName || 'Other')))]
    const bestSellers = menu.filter(m => m.isBestSeller)
    const recommended = menu.filter(m => m.isRecommended)

    const currentTheme = themeConfig[restaurant.theme as keyof typeof themeConfig] || themeConfig['modern-emerald']

    const filteredMenu = selectedCategory === 'all'
        ? menu
        : menu.filter(m => (m.categoryName || 'Other') === selectedCategory)

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

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

    const handleProceedToCheckout = () => {
        setCartDialogOpen(false)
        setCheckoutDialogOpen(true)
    }

    const processOrder = async () => {
        if (!selectedPaymentMethod) {
            toast({ title: 'Payment Required', description: 'Please select a payment method', variant: 'destructive' })
            return
        }
        if (!guestName) {
            toast({ title: 'Name Required', description: 'Please enter your name (Atas Nama)', variant: 'destructive' })
            return
        }

        setProcessingPayment(true)

        try {
            // Prepare payload for API
            const orderPayload = {
                restaurantId: restaurant?.id,
                customerName: guestName,
                customerPhone: guestPhone,
                tableNumber,
                notes,
                paymentMethod: selectedPaymentMethod,
                items: cart.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: item.price,
                    notes: '' // Add notes field to cart items if needed later
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

            toast({ title: 'Order Placed!', description: 'Your order has been sent to the kitchen.' })
        } catch (error: any) {
            console.error("Order failed", error)
            toast({ title: 'Order Failed', description: error.message || 'Please try again.', variant: 'destructive' })
        } finally {
            setProcessingPayment(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-40">
            {/* Header */}
            <div className={`bg-gradient-to-r ${currentTheme.gradient} text-white p-6 sticky top-0 z-20 shadow-lg`}>
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">{restaurant.name}</h1>
                        <p className={`${currentTheme.textLight} text-xs sm:text-sm mt-1`}>{restaurant.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                            {/* Rating removed as requested */}
                            <span className="text-xs sm:text-sm opacity-90">{restaurant.address}</span>
                        </div>
                    </div>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white md:hidden">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Menu Categories</SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-2 py-4">
                                {categories.map(cat => (
                                    <Button key={cat} variant="ghost" className="justify-start" onClick={() => setSelectedCategory(cat)}>
                                        {cat === 'all' ? 'All Menu' : cat}
                                    </Button>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Categories */}
            <div className="bg-white border-b sticky top-[100px] z-10 overflow-x-auto no-scrollbar">
                <div className="max-w-4xl mx-auto px-4 py-3 flex gap-2">
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap rounded-full ${selectedCategory === cat ? `${currentTheme.primary} ${currentTheme.primaryHover} text-white` : ''}`}
                        >
                            {cat === 'all' ? 'All Menu' : cat}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

                {/* Best Sellers Section */}
                {selectedCategory === 'all' && bestSellers.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-orange-600">
                            <Flame className="h-5 w-5 fill-orange-500" /> Best Sellers
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                            {bestSellers.map(item => (
                                <Card key={'bs-' + item.id} className="min-w-[200px] w-[200px] flex-shrink-0 overflow-hidden shadow-sm hover:shadow-md">
                                    <div className="h-32 bg-gray-200 relative">
                                        {item.image ? (
                                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">BEST SELLER</div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-medium text-sm truncate">{item.name}</h3>
                                        <p className={`${currentTheme.textPrimary} font-bold text-sm mt-1`}>Rp {item.price.toLocaleString()}</p>
                                        <Button size="sm" className={`w-full mt-2 h-8 ${currentTheme.badge} ${currentTheme.bgLightHover}`} onClick={() => handleAddToCart(item)}>Add</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recommended Section */}
                {selectedCategory === 'all' && recommended.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-600">
                            <ThumbsUp className="h-5 w-5 fill-blue-500" /> Recommended
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommended.map(item => (
                                <div key={'rec-' + item.id} className="bg-white p-3 rounded-xl border flex gap-3 shadow-sm">
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg relative overflow-hidden flex-shrink-0">
                                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">{item.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="font-bold text-sm">Rp {item.price.toLocaleString()}</span>
                                            <Button size="sm" className={`h-7 px-3 ${currentTheme.primary} ${currentTheme.primaryHover}`} onClick={() => handleAddToCart(item)}><Plus className="h-3 w-3" /></Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* All Menu Items */}
                <section>
                    <h2 className="text-lg font-bold mb-4">
                        {selectedCategory === 'all' ? 'Full Menu' : selectedCategory}
                    </h2>
                    <div className="grid gap-4">
                        {filteredMenu.map(item => (
                            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow border-none shadow-sm ring-1 ring-gray-100">
                                <div className="flex gap-4 p-4">
                                    {item.image && (
                                        <div className="w-24 h-24 relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className={`text-lg font-bold ${currentTheme.textPrimary}`}>
                                                Rp {item.price.toLocaleString('id-ID')}
                                            </span>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAddToCart(item)}
                                                className={`${currentTheme.primary} ${currentTheme.primaryHover}`}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>

            {/* Floating Cart Button */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 z-20 safe-area-bottom">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">{cartItemCount} items</div>
                            <div className={`text-lg font-bold ${currentTheme.textPrimary}`}>
                                Rp {cartTotal.toLocaleString('id-ID')}
                            </div>
                        </div>
                        <Button
                            size="lg"
                            className={`${currentTheme.primary} ${currentTheme.primaryHover}`}
                            onClick={() => setCartDialogOpen(true)}
                        >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            View Cart & Checkout
                        </Button>
                    </div>
                </div>
            )}

            {/* Cart Dialog */}
            <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Your Cart</DialogTitle>
                        <DialogDescription>{restaurant.name}</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-80">
                        <div className="space-y-3 py-4">
                            {cart.map(item => (
                                <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{item.menuItemName}</p>
                                        <p className="text-xs text-gray-500">{item.categoryName}</p>
                                        <p className="text-sm font-semibold text-emerald-600">Rp {item.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartItemQuantity(item.menuItemId, item.quantity - 1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartItemQuantity(item.menuItemId, item.quantity + 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeFromCart(item.menuItemId)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">Total:</span>
                            <span className="text-2xl font-bold text-emerald-600">Rp {cartTotal.toLocaleString()}</span>
                        </div>
                        <Button onClick={handleProceedToCheckout} className="w-full bg-emerald-600 hover:bg-emerald-700">
                            Proceed to Checkout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Checkout Dialog */}
            <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Checkout</DialogTitle>
                        <DialogDescription>Complete your order from {restaurant.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">{cartItemCount} items</span>
                                <span className="font-bold text-emerald-600">Rp {cartTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Your Name (Atas Nama) *</Label>
                            <Input placeholder="Enter your name" value={guestName} onChange={e => setGuestName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input placeholder="08123..." value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Table Number</Label>
                            <Input placeholder="Table 1" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Payment Method *</Label>
                            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(restaurant.paymentMethods || [])
                                        .filter((m: any) => m.isActive)
                                        .map((method: any) => (
                                            <SelectItem key={method.id} value={method.type}>
                                                <div className="flex items-center gap-2">
                                                    <span>{method.type === 'QRIS' ? '💳' : '💵'}</span>
                                                    <span>{method.type}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Method QR Display & Download */}
                        {selectedPaymentMethod && selectedPaymentMethod !== 'CASH' && (
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex flex-col items-center">
                                {(() => {
                                    const method = restaurant.paymentMethods?.find((m: any) => m.type === selectedPaymentMethod);

                                    // If we have an uploaded QR code/image for this method
                                    if (method?.qrCode) {
                                        return (
                                            <>
                                                <div className="bg-white p-2 rounded shadow-sm mb-2 w-full max-w-[200px] aspect-square relative">
                                                    <Image
                                                        src={method.qrCode}
                                                        alt={`${selectedPaymentMethod} QR`}
                                                        fill
                                                        className="object-contain"
                                                        unoptimized
                                                    />
                                                </div>
                                                <p className="font-medium text-emerald-800 mb-2">Scan {selectedPaymentMethod} to Pay</p>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full gap-2 border-emerald-200 hover:bg-emerald-100 text-emerald-700"
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = method.qrCode || '';
                                                        link.download = `${selectedPaymentMethod}-${restaurant.name}.png`;
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        toast({ title: "Saved!", description: `${selectedPaymentMethod} image downloaded.` })
                                                    }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Save Image
                                                </Button>
                                            </>
                                        )
                                    }

                                    // Fallback text if no QR uploaded
                                    return (
                                        <div className="text-center">
                                            <CreditCard className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                                            <p className="text-sm text-gray-600">Please complete payment via {selectedPaymentMethod}</p>
                                            <p className="text-xs text-gray-500 mt-1">(No QR code uploaded for this method)</p>
                                        </div>
                                    )
                                })()}
                            </div>
                        )}

                        <Button onClick={processOrder} disabled={processingPayment} className="w-full bg-emerald-600 hover:bg-emerald-700 sticky bottom-0 z-10 shadow-lg">
                            {processingPayment ? 'Processing...' : `Pay Rp ${cartTotal.toLocaleString()}`}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Order Confirmation Dialog */}
            <Dialog open={orderConfirmationOpen} onOpenChange={setOrderConfirmationOpen}>
                <DialogContent className="sm:max-w-md">
                    <div className="text-center py-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl mb-2">Order Placed!</DialogTitle>
                        <div className="text-left space-y-3 mt-6">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="font-semibold mb-2">Order Details</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Order Number:</span>
                                        <span className="font-semibold">{completedOrder?.orderNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total:</span>
                                        <span className="font-bold text-emerald-600">Rp {completedOrder?.totalAmount?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-green-800 font-medium">✅ Your order is being prepared!</p>
                            </div>
                        </div>
                        <Button onClick={() => setOrderConfirmationOpen(false)} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700">
                            Continue Ordering
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
                <div className="grid grid-cols-3 gap-1 px-4 py-3">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Home className="h-6 w-6 text-gray-600" />
                        <span className="text-xs mt-1 text-gray-600 font-medium">Home</span>
                    </button>
                    <button
                        onClick={() => {
                            const categorySection = document.getElementById('category-section')
                            categorySection?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <LayoutGrid className="h-6 w-6 text-gray-600" />
                        <span className="text-xs mt-1 text-gray-600 font-medium">Menu</span>
                    </button>
                    <button
                        onClick={() => setCartDialogOpen(true)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                    >
                        <ShoppingCart className="h-6 w-6 text-gray-600" />
                        {cartItemCount > 0 && (
                            <span className="absolute top-1 right-6 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {cartItemCount}
                            </span>
                        )}
                        <span className="text-xs mt-1 text-gray-600 font-medium">Cart</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
