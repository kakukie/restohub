'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, ShoppingCart, Plus, Minus, Star, Store, Clock } from 'lucide-react'
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
  isBestSeller?: boolean
  isRecommended?: boolean
}

interface Restaurant {
  id: string
  name: string
  description: string
  logo?: string
  rating?: number
  address?: string
}

interface CartItem {
  menuItemId: string
  menuItemName: string
  price: number
  quantity: number
  image?: string
  categoryName: string
}

export default function PublicMenuPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')

  // Get restaurant ID from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/')
    const restaurantId = pathParts[pathParts.length - 1]
    loadRestaurantData(restaurantId)
  }, [])

  const loadRestaurantData = async (restaurantId: string) => {
    try {
      setLoading(true)
      // Mock data - in real app, fetch from API
      const mockRestaurant: Restaurant = {
        id: restaurantId,
        name: 'Warung Rasa Nusantara',
        description: 'Authentic Indonesian cuisine with traditional recipes',
        logo: '/restaurant-logo-indo.png',
        rating: 4.8,
        address: 'Jl. Sudirman No. 123, Jakarta'
      }

      const mockMenuItems: MenuItem[] = [
        {
          id: '1',
          name: 'Nasi Goreng Spesial',
          description: 'Fried rice with special spices and toppings',
          price: 35000,
          categoryName: 'Main Course',
          categoryId: '1',
          image: '/menu-nasi-goreng.png',
          isBestSeller: true,
          isRecommended: true
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
        },
        {
          id: '5',
          name: 'Gado-Gado',
          description: 'Indonesian salad with peanut sauce',
          price: 28000,
          categoryName: 'Main Course',
          categoryId: '1',
          image: '/menu-gado-gado.png'
        },
        {
          id: '6',
          name: 'Mie Goreng',
          description: 'Fried noodles with vegetables and egg',
          price: 22000,
          categoryName: 'Main Course',
          categoryId: '1',
          image: '/menu-mie-goreng.png'
        }
      ]

      setRestaurant(mockRestaurant)
      setMenuItems(mockMenuItems)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load menu data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item: MenuItem) => {
    const existingItem = cart.find(c => c.menuItemId === item.id)

    if (existingItem) {
      setCart(cart.map(c =>
        c.menuItemId === item.id
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ))
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        menuItemName: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        categoryName: item.categoryName
      }])
    }

    toast({
      title: 'Added to Cart',
      description: `${item.name} has been added to your cart`,
    })
  }

  const updateCartItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(c => c.menuItemId !== menuItemId))
    } else {
      setCart(cart.map(c =>
        c.menuItemId === menuItemId
          ? { ...c, quantity }
          : c
      ))
    }
  }

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter(c => c.menuItemId !== menuItemId))
  }

  const getTotalCartAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
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
    if (!tableNumber) {
      toast({
        title: 'Table Number Required',
        description: 'Please enter your table number',
        variant: 'destructive'
      })
      return
    }
    setCheckoutDialogOpen(true)
  }

  const processOrder = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast({
        title: 'Order Placed Successfully!',
        description: 'Your order has been placed and is being processed.',
      })

      setCart([])
      setCheckoutDialogOpen(false)
      setTableNumber('')
      setNotes('')
    } catch (error) {
      toast({
        title: 'Order Failed',
        description: 'Failed to place your order. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {restaurant && (
              <div className="flex items-center gap-3">
                {restaurant.logo && (
                  <Image
                    src={restaurant.logo}
                    alt={restaurant.name}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{restaurant.name}</h1>
                  {restaurant.rating && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span>{restaurant.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {restaurant && (
          <>
            <div className="mb-8 text-center">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {restaurant.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {restaurant.description}
                </p>
                {restaurant.address && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Store className="h-4 w-4" />
                    <span>{restaurant.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Table Number Input */}
            <div className="max-w-md mx-auto mb-8">
              <label htmlFor="table-number" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Table Number *
              </label>
              <Input
                id="table-number"
                type="number"
                placeholder="Enter your table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => (
                <Card key={item.id} className="border-2 overflow-hidden hover:shadow-lg transition-shadow">
                  {item.image && (
                    <div className="relative h-48 w-full bg-gray-200">
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
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.categoryName}
                          </Badge>
                          {item.isBestSeller && (
                            <Badge className="text-xs bg-orange-500 hover:bg-orange-600 border-none text-white">
                              Best Seller
                            </Badge>
                          )}
                          {item.isRecommended && (
                            <Badge className="text-xs bg-blue-500 hover:bg-blue-600 border-none text-white">
                              Recommended
                            </Badge>
                          )}
                        </div>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Review your order before placing it
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Order Summary</h3>
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
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    Rp {getTotalCartAmount().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Order Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Table Number</p>
                  <p className="font-semibold text-lg">{tableNumber}</p>
                </div>
                {notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-sm">{notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Restaurant</p>
                  <p className="font-semibold">{restaurant?.name}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={processOrder} className="bg-orange-600 hover:bg-orange-700">
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            © 2024 RestoHub. Digital Restaurant Platform
          </p>
        </div>
      </footer>
    </div>
  )
}
