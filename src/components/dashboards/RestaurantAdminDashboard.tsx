'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useAppStore, MenuItem, Category, PaymentMethod, Order } from '@/store/app-store'
import { toast } from '@/hooks/use-toast'
import QRCodeDialog from '@/components/common/QRCodeDialog'

// New Components
import Sidebar from './restaurant/Sidebar'
import Header from './restaurant/Header'
import StatsGrid from './restaurant/StatsGrid'
import RecentOrders from './restaurant/RecentOrders'
import PaymentMethods from './restaurant/PaymentMethods'
import BestSellers from './restaurant/BestSellers'

// Legacy / Existing Sub-Components (We will reuse these or refactor later)
// For now, we reuse the logic and render them conditionally
import RestaurantSettingsForm from './forms/RestaurantSettingsForm'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs' // Might still need for sub-tabs
import { Plus, Edit, Trash2, Search, Filter, RefreshCw, Printer, Grid, List, Eye, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'

// ... (Import other necessary UI components like in Old file)

interface OrderItem {
    menuItemId: string
    menuItemName: string
    price: number
    quantity: number
    categoryName?: string
    notes?: string
}

export default function RestaurantAdminDashboard() {
    const {
        user,
        logout,
        restaurants,
        setRestaurants,
        orders,
        setOrders,
        helpdeskSettings,
        language,
        setLanguage
    } = useAppStore()

    // --- STATE MANAGEMENT (Copied from Old) ---
    const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'orders' | 'menu' | 'settings' | 'categories' | 'analytics'
    const [categories, setCategories] = useState<Category[]>([])
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [myBranches, setMyBranches] = useState<any[]>([])
    const [reportStats, setReportStats] = useState<any>({})

    // Dialog States
    const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false)
    const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false)
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [viewOrder, setViewOrder] = useState<Order | null>(null)

    // Forms & Editing
    const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
    const [menuItemForm, setMenuItemForm] = useState<Partial<MenuItem>>({})
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [categoryForm, setCategoryForm] = useState<Partial<Category>>({})

    // Payment Method States
    const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)
    const [paymentMethodForm, setPaymentMethodForm] = useState<Partial<PaymentMethod>>({})

    // Order Validation States
    const [validateOrderId, setValidateOrderId] = useState<string | null>(null)
    const [manualEmail, setManualEmail] = useState('')
    const [manualPhone, setManualPhone] = useState('')

    // Menu Management States
    const [menuSearchQuery, setMenuSearchQuery] = useState('')
    const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('ALL')
    const [menuViewMode, setMenuViewMode] = useState<'grid' | 'table'>('grid')
    const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([])

    const [restaurantId, setRestaurantId] = useState<string>('')
    const [currentRestaurant, setCurrentRestaurant] = useState<any>(null)

    // --- DATA FETCHING (Copied from Old) ---
    // ... (Refer to Old file for loadRestaurantDetails, loadMenuData, loadOrderData)

    const loadRestaurantDetails = useCallback(async () => {
        if (!user?.restaurantId) return
        setRestaurantId(user.restaurantId)
        try {
            const res = await fetch(`/api/restaurants/${user.restaurantId}`)
            const data = await res.json()
            if (data.success) {
                setCurrentRestaurant(data.data)
                setCategories(data.data.categories || [])
                setMenuItems(data.data.menuItems || [])
                setPaymentMethods(data.data.paymentMethods || [])
                setMyBranches(data.data.branches || [])
            }
        } catch (error) {
            console.error("Failed to load details", error)
        }
    }, [user?.restaurantId])

    const loadOrderData = useCallback(async () => {
        // ... Implementation from Old
        if (!user?.restaurantId) return
        try {
            const res = await fetch(`/api/orders?restaurantId=${user.restaurantId}`)
            const data = await res.json()
            if (data.success) setOrders(data.data)
        } catch (e) { }
    }, [user?.restaurantId, setOrders])

    useEffect(() => {
        loadRestaurantDetails()
        loadOrderData()
    }, [loadRestaurantDetails, loadOrderData])

    // --- HANDLERS ---

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                callback(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSaveMenuItem = async () => {
        if (!menuItemForm.name || !menuItemForm.price || !menuItemForm.categoryId) {
            return toast({ title: "Error", description: "Name, price, and category are required", variant: "destructive" })
        }
        try {
            const url = editingMenuItem ? `/api/menu-items/${editingMenuItem.id}` : '/api/menu-items'
            const method = editingMenuItem ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...menuItemForm, restaurantId: user?.restaurantId })
            })
            if (res.ok) {
                toast({ title: "Success", description: "Menu item saved" })
                setMenuItemDialogOpen(false)
                setEditingMenuItem(null)
                setMenuItemForm({})
                loadRestaurantDetails()
            } else {
                toast({ title: "Error", description: "Failed to save", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save", variant: "destructive" })
        }
    }

    const handleDeleteMenuItem = async (id: string) => {
        if (!confirm("Delete this menu item?")) return
        try {
            await fetch(`/api/menu-items/${id}`, { method: 'DELETE' })
            loadRestaurantDetails()
            toast({ title: "Success", description: "Menu item deleted" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
        }
    }

    const handlePrintOrder = (order: any) => {
        // Simple print implementation
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head><title>Order #${order.orderNumber}</title></head>
                <body>
                    <h1>Order #${order.orderNumber}</h1>
                    <p>Customer: ${order.customerName}</p>
                    <p>Table: ${order.tableNumber || 'Takeaway'}</p>
                    <hr/>
                    ${order.items.map((item: any) => `<p>${item.quantity}x ${item.menuItemName} - Rp ${item.price * item.quantity}</p>`).join('')}
                    <hr/>
                    <h3>Total: Rp ${order.totalAmount}</h3>
                </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.print()
        }
    }

    const handleValidateOrder = async () => {
        if (!validateOrderId) return
        try {
            const res = await fetch(`/api/orders/${validateOrderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'CONFIRMED',
                    manualEmail: manualEmail || undefined,
                    manualPhone: manualPhone || undefined
                })
            })
            if (res.ok) {
                toast({ title: "Success", description: "Order confirmed" })
                setValidateOrderId(null)
                setManualEmail('')
                setManualPhone('')
                loadOrderData()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to confirm order", variant: "destructive" })
        }
    }

    const handleSaveCategory = async () => {
        if (!categoryForm.name) {
            return toast({ title: "Error", description: "Category name is required", variant: "destructive" })
        }

        // Check limit
        if (!editingCategory && categories.length >= (currentRestaurant?.maxCategories || 0) && currentRestaurant?.maxCategories !== 0) {
            return toast({ title: "Error", description: `Category limit reached (${currentRestaurant?.maxCategories} categories)`, variant: "destructive" })
        }

        try {
            const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
            const method = editingCategory ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...categoryForm,
                    restaurantId: user?.restaurantId
                })
            })

            if (res.ok) {
                toast({ title: "Success", description: "Category saved" })
                setCategoryDialogOpen(false)
                setEditingCategory(null)
                setCategoryForm({})
                loadRestaurantDetails()
            } else {
                const error = await res.json()
                toast({ title: "Error", description: error.message || "Failed to save category", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save category", variant: "destructive" })
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Delete this category? Menu items in this category will need to be reassigned.")) return
        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
            if (res.ok) {
                loadRestaurantDetails()
                toast({ title: "Success", description: "Category deleted" })
            } else {
                toast({ title: "Error", description: "Failed to delete category", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete category", variant: "destructive" })
        }
    }

    const handleSavePaymentMethod = async () => {
        if (!paymentMethodForm.type) return toast({ title: "Error", description: "Method type is required", variant: "destructive" })
        try {
            const url = paymentMethodForm.id ? `/api/payment-methods/${paymentMethodForm.id}` : '/api/payment-methods'
            const method = paymentMethodForm.id ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...paymentMethodForm, restaurantId: user?.restaurantId })
            })
            if (res.ok) {
                toast({ title: "Success", description: "Payment method saved" })
                setPaymentMethodDialogOpen(false)
                loadRestaurantDetails() // Refresh
            } else {
                toast({ title: "Error", description: "Failed to save", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save", variant: "destructive" })
        }
    }

    const handleDeletePaymentMethod = async (id: string) => {
        if (!confirm("Delete this payment method?")) return
        try {
            await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
            loadRestaurantDetails()
            toast({ title: "Success", description: "Deleted" })
        } catch (error) { }
    }

    const handleTogglePaymentMethod = async (id: string, isActive: boolean) => {
        try {
            await fetch(`/api/payment-methods/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            })
            loadRestaurantDetails()
        } catch (error) { }
    }

    // --- RENDER HELPERS ---
    const renderDashboardContent = () => (
        <>
            <StatsGrid stats={{
                totalOrders: orders.length,
                revenue: orders.reduce((acc, o) => acc + o.totalAmount, 0),
                totalCategories: categories.length,
                cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length
            }} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <RecentOrders
                        orders={orders}
                        onViewOrder={(order) => setViewOrder(order)}
                        onPrintOrder={(order) => { /* handlePrintOrder(order) */ }}
                        onRefresh={loadOrderData}
                    />
                </div>
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payments</h2>
                        <Button size="sm" onClick={() => { setPaymentMethodForm({}); setPaymentMethodDialogOpen(true) }} className="bg-emerald-500 hover:bg-emerald-600">
                            <Plus className="h-4 w-4 mr-2" /> Add
                        </Button>
                    </div>

                    <PaymentMethods
                        methods={paymentMethods}
                        onToggle={handleTogglePaymentMethod}
                        onEdit={(method) => {
                            setPaymentMethodForm(method)
                            setPaymentMethodDialogOpen(true)
                        }}
                        onDelete={(id) => handleDeletePaymentMethod(id)}
                    />
                    <BestSellers
                        items={menuItems.map(m => ({
                            id: m.id,
                            name: m.name,
                            price: m.price,
                            imageUrl: m.imageUrl,
                            soldCount: 0 // Mock for now
                        }))}
                    />
                </div>

                {/* Payment Method Dialog */}
                <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{paymentMethodForm.id ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
                            <DialogDescription>Configure payment details</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="payment-type">Payment Method *</Label>
                                <Select
                                    value={paymentMethodForm.type || ''}
                                    onValueChange={(value) => setPaymentMethodForm({ ...paymentMethodForm, type: value })}
                                >
                                    <SelectTrigger id="payment-type">
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="QRIS">QRIS</SelectItem>
                                        <SelectItem value="GOPAY">GoPay</SelectItem>
                                        <SelectItem value="OVO">OVO</SelectItem>
                                        <SelectItem value="DANA">DANA</SelectItem>
                                        <SelectItem value="LINKAJA">LinkAja</SelectItem>
                                        <SelectItem value="SHOPEEPAY">ShopeePay</SelectItem>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* QR Code Upload for applicable methods */}
                            {['QRIS', 'GOPAY', 'DANA', 'OVO', 'SHOPEEPAY', 'LINKAJA'].includes(paymentMethodForm.type || '') && (
                                <div className="space-y-2">
                                    <Label htmlFor="qr-image">QR Code Image</Label>
                                    <Input
                                        id="qr-image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, (base64) => setPaymentMethodForm({ ...paymentMethodForm, qrCode: base64 }))}
                                    />
                                    {paymentMethodForm.qrCode && (
                                        <div className="mt-2 relative h-32 w-32 border rounded-lg overflow-hidden bg-white">
                                            <Image
                                                src={paymentMethodForm.qrCode}
                                                alt="QR Preview"
                                                fill
                                                className="object-contain"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => setPaymentMethodForm({ ...paymentMethodForm, qrCode: undefined })}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="merchant-id">Merchant ID (Optional)</Label>
                                <Input
                                    id="merchant-id"
                                    value={paymentMethodForm.merchantId || ''}
                                    onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, merchantId: e.target.value })}
                                    placeholder="Enter merchant ID"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSavePaymentMethod} className="bg-green-600 hover:bg-green-700">
                                {paymentMethodForm.id ? 'Save Changes' : 'Add Payment Method'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    )

    const renderMenuContent = () => {
        // Filter menu items based on search and category
        const filteredMenuItems = menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(menuSearchQuery.toLowerCase())
            const matchesCategory = menuCategoryFilter === 'ALL' || item.categoryId === menuCategoryFilter
            return matchesSearch && matchesCategory
        })

        const handleBulkDelete = async () => {
            if (!confirm(`Delete ${selectedMenuItems.length} selected items?`)) return
            try {
                await Promise.all(selectedMenuItems.map(id =>
                    fetch(`/api/menu-items/${id}`, { method: 'DELETE' })
                ))
                setSelectedMenuItems([])
                loadRestaurantDetails()
                toast({ title: "Success", description: `${selectedMenuItems.length} items deleted` })
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete items", variant: "destructive" })
            }
        }

        const handleBulkToggleAvailability = async (isAvailable: boolean) => {
            try {
                await Promise.all(selectedMenuItems.map(id =>
                    fetch(`/api/menu-items/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, isAvailable })
                    })
                ))
                setSelectedMenuItems([])
                loadRestaurantDetails()
                toast({ title: "Success", description: `${selectedMenuItems.length} items ${isAvailable ? 'enabled' : 'disabled'}` })
            } catch (error) {
                toast({ title: "Error", description: "Failed to update items", variant: "destructive" })
            }
        }

        const toggleSelectItem = (id: string) => {
            setSelectedMenuItems(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            )
        }

        const toggleSelectAll = () => {
            if (selectedMenuItems.length === filteredMenuItems.length) {
                setSelectedMenuItems([])
            } else {
                setSelectedMenuItems(filteredMenuItems.map(item => item.id))
            }
        }

        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* Header with Search and Filters */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Menu Items</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            <span className={(currentRestaurant?.maxMenuItems && menuItems.length >= currentRestaurant.maxMenuItems) ? 'text-red-500 font-bold' : 'text-emerald-600 font-medium'}>
                                {menuItems.length} / {currentRestaurant?.maxMenuItems === 0 || !currentRestaurant?.maxMenuItems ? 'Unlimited' : currentRestaurant.maxMenuItems} items
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMenuViewMode('grid')}
                            className={menuViewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : ''}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMenuViewMode('table')}
                            className={menuViewMode === 'table' ? 'bg-emerald-50 text-emerald-600' : ''}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search menu items..."
                            value={menuSearchQuery}
                            onChange={(e) => setMenuSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={menuCategoryFilter} onValueChange={setMenuCategoryFilter}>
                        <SelectTrigger className="w-full lg:w-48">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedMenuItems.length > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            {selectedMenuItems.length} item(s) selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkToggleAvailability(true)}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Enable
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkToggleAvailability(false)}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Disable
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        </div>
                    </div>
                )}

                {/* Grid View */}
                {menuViewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMenuItems.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                <p>No menu items found. {menuSearchQuery || menuCategoryFilter !== 'ALL' ? 'Try adjusting your filters.' : 'Add your first menu item to get started.'}</p>
                            </div>
                        ) : (
                            filteredMenuItems.map(item => (
                                <Card key={item.id} className={`hover:shadow-lg transition-shadow ${selectedMenuItems.includes(item.id) ? 'ring-2 ring-emerald-500' : ''}`}>
                                    <CardHeader className="relative">
                                        <input
                                            type="checkbox"
                                            checked={selectedMenuItems.includes(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                            className="absolute top-4 left-4 h-4 w-4 rounded border-gray-300"
                                        />
                                        {item.image && (
                                            <div className="relative h-40 w-full rounded-lg overflow-hidden mb-3">
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                            </div>
                                        )}
                                        <CardTitle className="flex justify-between items-start">
                                            <span className="flex-1">{item.name}</span>
                                            <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                                                {item.isAvailable ? 'Available' : 'Unavailable'}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {item.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                                        )}
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-lg font-bold text-emerald-600">Rp {item.price.toLocaleString()}</span>
                                            {item.stock !== null && item.stock !== undefined && (
                                                <span className="text-xs text-slate-500">Stock: {item.stock}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setEditingMenuItem(item)
                                                    setMenuItemForm(item)
                                                    setMenuItemDialogOpen(true)
                                                }}
                                            >
                                                <Edit className="h-3 w-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteMenuItem(item.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Table View */}
                {menuViewMode === 'table' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="p-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedMenuItems.length === filteredMenuItems.length && filteredMenuItems.length > 0}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="p-3 text-left text-sm font-semibold">Image</th>
                                    <th className="p-3 text-left text-sm font-semibold">Name</th>
                                    <th className="p-3 text-left text-sm font-semibold">Category</th>
                                    <th className="p-3 text-left text-sm font-semibold">Price</th>
                                    <th className="p-3 text-left text-sm font-semibold">Stock</th>
                                    <th className="p-3 text-left text-sm font-semibold">Status</th>
                                    <th className="p-3 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMenuItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-500">
                                            No menu items found. {menuSearchQuery || menuCategoryFilter !== 'ALL' ? 'Try adjusting your filters.' : 'Add your first menu item to get started.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMenuItems.map(item => (
                                        <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <td className="p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMenuItems.includes(item.id)}
                                                    onChange={() => toggleSelectItem(item.id)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                            </td>
                                            <td className="p-3">
                                                {item.image && (
                                                    <div className="relative h-12 w-12 rounded overflow-hidden">
                                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    {item.description && (
                                                        <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm">
                                                {categories.find(c => c.id === item.categoryId)?.name || '-'}
                                            </td>
                                            <td className="p-3 text-sm font-medium text-emerald-600">
                                                Rp {item.price.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-sm">
                                                {item.stock !== null && item.stock !== undefined ? item.stock : '-'}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant={item.isAvailable ? 'default' : 'secondary'} className="text-xs">
                                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingMenuItem(item)
                                                            setMenuItemForm(item)
                                                            setMenuItemDialogOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteMenuItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    }

    const renderCategoriesContent = () => (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Categories</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        <span className={(currentRestaurant?.maxCategories && categories.length >= currentRestaurant.maxCategories) ? 'text-red-500 font-bold' : 'text-emerald-600 font-medium'}>
                            {categories.length} / {currentRestaurant?.maxCategories === 0 || !currentRestaurant?.maxCategories ? 'Unlimited' : currentRestaurant.maxCategories} categories used
                        </span>
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCategory(null)
                        setCategoryForm({})
                        setCategoryDialogOpen(true)
                    }}
                    disabled={currentRestaurant?.maxCategories !== 0 && categories.length >= (currentRestaurant?.maxCategories || 0)}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {currentRestaurant?.maxCategories !== 0 && categories.length >= (currentRestaurant?.maxCategories || 0) ? 'Limit Reached' : 'Add Category'}
                </Button>
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <p>No categories yet. Create your first category to organize your menu.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                        <Card key={category.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>{category.name}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingCategory(category)
                                                setCategoryForm(category)
                                                setCategoryDialogOpen(true)
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteCategory(category.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {category.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{category.description}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-2">
                                    {menuItems.filter(item => item.categoryId === category.id).length} items
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

    // ... renderOrdersContent, renderSettingsContent ...

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                onLogout={logout}
            />

            <main className="lg:ml-24 p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto">
                <Header
                    restaurantName={currentRestaurant?.name}
                    userName={user?.name}
                    onShowQR={() => setQrCodeDialogOpen(true)}
                    onAddItem={() => {
                        setEditingMenuItem(null)
                        setMenuItemForm({})
                        setMenuItemDialogOpen(true)
                    }}
                />

                {activeTab === 'dashboard' && renderDashboardContent()}
                {activeTab === 'menu' && renderMenuContent()}
                {activeTab === 'categories' && renderCategoriesContent()}
                {/* {activeTab === 'orders' && renderOrdersContent()} */}
                {/* {activeTab === 'settings' && renderSettingsContent()} */}

            </main>

            {/* Dialogs */}
            <QRCodeDialog
                open={qrCodeDialogOpen}
                onOpenChange={setQrCodeDialogOpen}
                restaurantSlug={currentRestaurant?.slug || currentRestaurant?.id || ''}
                restaurantName={currentRestaurant?.name || 'Restaurant'}
            />

            {/* Category Dialog */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? 'Update category details' : 'Create a new category to organize your menu'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">Category Name *</Label>
                            <Input
                                id="category-name"
                                value={categoryForm.name || ''}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                placeholder="e.g., Appetizers, Main Course, Desserts"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category-description">Description (Optional)</Label>
                            <Input
                                id="category-description"
                                value={categoryForm.description || ''}
                                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                placeholder="Brief description of this category"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category-order">Display Order (Optional)</Label>
                            <Input
                                id="category-order"
                                type="number"
                                value={categoryForm.displayOrder || ''}
                                onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 0 })}
                                placeholder="Order in menu (lower numbers appear first)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveCategory} className="bg-emerald-600 hover:bg-emerald-700">
                            {editingCategory ? 'Save Changes' : 'Add Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Menu Item Dialog */}
            <Dialog open={menuItemDialogOpen} onOpenChange={setMenuItemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
                        <DialogDescription>
                            {editingMenuItem ? 'Update menu item details' : 'Create a new menu item'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="menu-name">Name *</Label>
                            <Input
                                id="menu-name"
                                value={menuItemForm.name || ''}
                                onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                                placeholder="Menu item name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="menu-description">Description</Label>
                            <Input
                                id="menu-description"
                                value={menuItemForm.description || ''}
                                onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                                placeholder="Menu item description"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="menu-price">Price *</Label>
                            <Input
                                id="menu-price"
                                type="number"
                                value={menuItemForm.price || ''}
                                onChange={(e) => setMenuItemForm({ ...menuItemForm, price: parseFloat(e.target.value) })}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="menu-category">Category *</Label>
                            <Select
                                value={menuItemForm.categoryId || ''}
                                onValueChange={(value) => setMenuItemForm({ ...menuItemForm, categoryId: value })}
                            >
                                <SelectTrigger id="menu-category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="menu-image">Menu Image</Label>
                            <Input
                                id="menu-image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, (base64) => setMenuItemForm({ ...menuItemForm, image: base64 }))}
                            />
                            {menuItemForm.image && (
                                <div className="relative w-full h-40 mt-2 rounded-md overflow-hidden border">
                                    <Image src={menuItemForm.image} alt="Preview" fill className="object-cover" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6"
                                        onClick={() => setMenuItemForm({ ...menuItemForm, image: undefined })}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isBestSeller"
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={menuItemForm.isBestSeller || false}
                                    onChange={(e) => setMenuItemForm({ ...menuItemForm, isBestSeller: e.target.checked })}
                                />
                                <Label htmlFor="isBestSeller" className="cursor-pointer font-medium">Best Seller</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isRecommended"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={menuItemForm.isRecommended || false}
                                    onChange={(e) => setMenuItemForm({ ...menuItemForm, isRecommended: e.target.checked })}
                                />
                                <Label htmlFor="isRecommended" className="cursor-pointer font-medium">Recommended</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveMenuItem} className="bg-green-600 hover:bg-green-700">
                            {editingMenuItem ? 'Update' : 'Add'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Validation Dialog */}
            <Dialog open={!!validateOrderId} onOpenChange={(open) => !open && setValidateOrderId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Accept Order</DialogTitle>
                        <DialogDescription>
                            You can optionally enter customer contact details to send manual notification.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label>Manual Email (Optional)</Label>
                            <Input
                                placeholder="customer@example.com"
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Manual WhatsApp (Optional)</Label>
                            <Input
                                placeholder="62812..."
                                value={manualPhone}
                                onChange={(e) => setManualPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setValidateOrderId(null)}>Cancel</Button>
                        <Button className="bg-green-600 text-white" onClick={handleValidateOrder}>Confirm & Notify</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Order Dialog */}
            <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Order Details #{viewOrder?.orderNumber}</DialogTitle>
                    </DialogHeader>
                    {viewOrder && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Date:</span>
                                <span className="font-medium">{new Date(viewOrder.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Customer:</span>
                                <span className="font-medium">{viewOrder.customerName}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Type:</span>
                                <Badge variant="outline">{viewOrder.type}</Badge>
                            </div>
                            {viewOrder.tableNumber && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Table:</span>
                                    <span className="font-medium">{viewOrder.tableNumber}</span>
                                </div>
                            )}

                            <div className="border-t border-b py-2 my-2 space-y-2">
                                {viewOrder.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.menuItemName}</span>
                                        <span>Rp {(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total:</span>
                                <span>Rp {viewOrder.totalAmount.toLocaleString()}</span>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="outline" onClick={() => handlePrintOrder(viewOrder)}>
                                    <Printer className="h-4 w-4 mr-2" /> Print
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    )
}
