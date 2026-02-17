'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
import { Plus, Edit, Trash2, Search, Filter, RefreshCw, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
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

    // --- HANDLERS (Copied from Old) ---
    // handleSaveMenuItem, handleDeleteMenuItem, handleSaveCategory, handleDeleteCategory...
    // handlePrintOrder, handleUpdateOrderStatus...

    // Mock Handlers for new UI components
    const handleTogglePaymentMethod = async (id: string, isActive: boolean) => {
        // ... Implementation
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

    const renderMenuContent = () => (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Reuse the Table/Grid from Old Dashboard for Menu Items */}
            {/* We will need to copy the Menu Management JSX here */}
            <h2 className="text-xl font-bold mb-4">Menu Management</h2>
            {/* ... */}
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
