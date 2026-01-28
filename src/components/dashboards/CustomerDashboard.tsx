'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore, CartItem, Restaurant } from '@/store/app-store'
import { Search, ShoppingCart, Plus, Minus, Trash2, Store, Star, Clock, CreditCard, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/hooks/use-toast'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
  categoryName: string
  categoryId: string
}

interface PaymentMethod {
  id: string
  type: string
  isActive: boolean
}

export default function CustomerDashboard() {
  const {
    user,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItems,
    clearCart,
    restaurants, // From Store
    addOrder // From Store
  } = useAppStore()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  // Checkout states
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [tableNumber, setTableNumber] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<any>(null)

  const loadMenuItems = async (restaurantId: string) => {
    try {
      setLoading(true)
      // Mock data for demo - In real app, fetch based on Restaurant ID
      const mockMenuItems: MenuItem[] = [
        {
          id: '1',
          name: 'Nasi Goreng Spesial',
          description: 'Fried rice with special spices and toppings',
          price: 35000,
          categoryName: 'Main Course',
          categoryId: '1',
          image: '/menu-nasi-goreng.png'
        },
        {
          id: '2',
          name: 'Sate Ayam',
          description: 'Grilled chicken skewers with peanut sauce',
          price: 25000,
          categoryName: 'Appetizer',
          categoryId: '2',
          image: '/menu-sate-ayam.png'
        },
        {
          id: '3',
          name: 'Rendang',
          description: 'Slow-cooked beef in coconut milk',
          price: 45000,
          categoryName: 'Main Course',
          categoryId: '1',
          image: '/menu-rendang.png'
        },
        {
          id: '4',
          name: 'Es Teh Manis',
          description: 'Sweet iced tea',
          price: 8000,
          categoryName: 'Beverage',
          categoryId: '3',
          image: '/menu-es-teh.png'
        }
      ]
      setMenuItems(mockMenuItems)

      // Load payment methods for restaurant
      const mockPaymentMethods: PaymentMethod[] = [
        { id: '1', type: 'QRIS', isActive: true },
        { id: '2', type: 'GOPAY', isActive: true },
        { id: '3', type: 'OVO', isActive: true },
        { id: '4', type: 'DANA', isActive: true },
        { id: '5', type: 'LINKAJA', isActive: true },
        { id: '6', type: 'SHOPEEPAY', isActive: true },
        { id: '7', type: 'CASH', isActive: true }
      ]
      setPaymentMethods(mockPaymentMethods.filter(pm => pm.isActive))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    loadMenuItems(restaurant.id)
  }

  const handleAddToCart = (item: MenuItem) => {
    const cartItem: CartItem = {
      menuItemId: item.id,
      menuItemName: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      categoryName: item.categoryName
    }
    addToCart(cartItem)
    toast({
      title: 'Added to Cart',
      description: `${item.name} has been added to your cart`,
    })
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart Empty',
        description: 'Please add items to your cart first',
        variant: 'destructive'
      })
      return
    }
    setCheckoutDialogOpen(true)
    setCartOpen(false)
  }

  const processOrder = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: 'Payment Method Required',
        description: 'Please select a payment method',
        variant: 'destructive'
      })
      return
    }

    if (!guestName) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name (Atas Nama)',
        variant: 'destructive'
      })
      return
    }

    setProcessingPayment(true)

    try {
      // Create order data
      const orderData = {
        id: crypto.randomUUID(),
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        customerId: user?.id || 'GUEST',
        customerName: guestName,
        customerPhone: guestPhone,
        restaurantId: selectedRestaurant?.id || '',
        restaurantName: selectedRestaurant?.name || '',
        items: cart,
        totalAmount: getTotalCartAmount(),
        paymentMethod: selectedPaymentMethod,
        tableNumber,
        notes,
        status: 'PENDING' as const,
        paymentStatus: 'PENDING' as const,
        createdAt: new Date().toISOString()
      }

      // Add to Global Store (Simulation)
      addOrder(orderData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      const completedOrderData = {
        ...orderData,
        transactionId: `TXN-${Date.now()}`
      }

      setCompletedOrder(completedOrderData)
      setCheckoutDialogOpen(false)
      setOrderConfirmationOpen(true)

      // Clear cart
      clearCart()

      toast({
        title: 'Order Placed Successfully!',
        description: 'Your order has been placed and sent to the kitchen.',
      })
    } catch (error) {
      toast({
        title: 'Order Failed',
        description: 'Failed to place your order. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  const getPaymentMethodIcon = (type: string) => {
    const icons: Record<string, string> = {
      QRIS: '💳',
      GOPAY: '🟢',
      OVO: '🟣',
      DANA: '🔵',
      LINKAJA: '🔴',
      SHOPEEPAY: '🟠',
      CASH: '💵'
    }
    return icons[type] || '💳'
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    window.location.reload()
  }

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && restaurants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meenuin</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Customer Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {getTotalCartItems() > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-600">
                        {getTotalCartItems()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Your Cart</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ScrollArea className="max-h-96 pr-4">
                          <div className="space-y-3">
                            {cart.map((item) => (
                              <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{item.menuItemName}</p>
                                  <p className="text-xs text-gray-500">{item.categoryName}</p>
                                  <p className="text-sm font-semibold text-orange-600">Rp {item.price.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateCartItemQuantity(item.menuItemId, item.quantity - 1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateCartItemQuantity(item.menuItemId, item.quantity + 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600"
                                    onClick={() => removeFromCart(item.menuItemId)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="border-t pt-4 mt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-semibold">Total:</span>
                            <span className="text-2xl font-bold text-orange-600">
                              Rp {getTotalCartAmount().toLocaleString()}
                            </span>
                          </div>
                          <Button
                            onClick={handleCheckout}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                          >
                            Proceed to Checkout
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium">{user?.name}</span>
                <Badge variant="outline" className="text-xs">Customer</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!selectedRestaurant ? (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to RestoHub
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Select a restaurant to start ordering delicious food
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="cursor-pointer hover:shadow-lg transition-shadow border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {restaurant.logo && (
                          <Image
                            src={restaurant.logo}
                            alt={restaurant.name}
                            width={64}
                            height={64}
                            className="rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl mb-2">{restaurant.name}</CardTitle>
                          <CardDescription className="text-sm">{restaurant.description}</CardDescription>
                        </div>
                      </div>
                      {restaurant.rating && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {restaurant.rating}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>Open now</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleRestaurantSelect(restaurant)}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      View Menu
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRestaurant(null)
                  setMenuItems([])
                }}
                className="mb-4"
              >
                ← Back to Restaurants
              </Button>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedRestaurant.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {selectedRestaurant.description}
              </p>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => (
                <Card key={item.id} className="border-2 overflow-hidden">
                  {item.image && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mb-2">
                          {item.categoryName}
                        </Badge>
                        <CardDescription className="text-sm">
                          {item.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-orange-600">
                        Rp {item.price.toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredMenuItems.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No menu items found matching your search</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Checkout</DialogTitle>
            <DialogDescription>
              Complete your order from {selectedRestaurant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Order Summary</h3>
              <ScrollArea className="max-h-64 pr-4">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.menuItemName}</p>
                        <p className="text-xs text-gray-500">{item.categoryName} x {item.quantity}</p>
                      </div>
                      <p className="font-bold text-orange-600">
                        Rp {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    Rp {getTotalCartAmount().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment & Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="guest-name">Your Name (Atas Nama) *</Label>
                <Input
                  id="guest-name"
                  placeholder="Enter your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="guest-phone">Phone Number (Optional)</Label>
                <Input
                  id="guest-phone"
                  type="tel"
                  placeholder="081234567890"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="table-number">Table Number</Label>
                <Input
                  id="table-number"
                  placeholder="Enter table number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes">Special Instructions (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any special requests?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="payment-method">Payment Method *</Label>
                <Select
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                >
                  <SelectTrigger id="payment-method" className="mt-1">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.type}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getPaymentMethodIcon(method.type)}</span>
                          <span>{method.type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPaymentMethod && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="font-semibold">Payment Method: {selectedPaymentMethod}</p>
                      <p className="text-sm text-gray-600">
                        {selectedPaymentMethod === 'CASH' ? 'Pay at restaurant' : 'Scan QR code or use e-wallet'}
                      </p>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'QRIS' && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
                      <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 mx-auto mb-2 rounded flex items-center justify-center">
                        <span className="text-4xl">📱</span>
                      </div>
                      <p className="text-xs text-gray-500">Scan this QR code to pay</p>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={processOrder}
                disabled={processingPayment || !selectedPaymentMethod}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {processingPayment ? 'Processing...' : `Pay Rp ${getTotalCartAmount().toLocaleString()}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Dialog */}
      <Dialog open={orderConfirmationOpen} onOpenChange={setOrderConfirmationOpen}>
        <DialogContent className="max-w-lg">
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-2xl mb-2">Order Placed Successfully!</DialogTitle>
            <div className="text-left space-y-3 mt-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-semibold mb-2">Order Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-semibold">{completedOrder?.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Restaurant:</span>
                    <span className="font-semibold">{completedOrder?.restaurantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold flex items-center gap-1">
                      {getPaymentMethodIcon(completedOrder?.paymentMethod || '')} {completedOrder?.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-orange-600">Rp {completedOrder?.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-semibold text-xs">{completedOrder?.transactionId}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                  ✅ Your payment has been successfully processed!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Your order is now being prepared. The restaurant will receive your order details and start processing it.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setOrderConfirmationOpen(false)}
              className="w-full mt-6 bg-orange-600 hover:bg-orange-700"
            >
              Continue Ordering
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            © 2024 Meenuin Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
