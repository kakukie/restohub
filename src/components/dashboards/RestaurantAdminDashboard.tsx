'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAppStore, MenuItem, Category, PaymentMethod } from '@/store/app-store'
import { Store, Plus, Edit, Trash2, CreditCard, Package, LayoutGrid, LogOut, DollarSign, ShoppingBag, TrendingUp, CheckCircle, XCircle, Clock, QrCode, Printer, BarChart3, FileText, Download, Calendar, LifeBuoy, MessageCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'
import QRCodeDialog from '@/components/common/QRCodeDialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Megaphone as MegaphoneIcon, Settings } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'



interface OrderItem {
  menuItemId: string
  menuItemName: string
  price: number
  quantity: number
  categoryName?: string
}

import { Order } from '@/store/app-store'
import RestaurantSettingsForm from './forms/RestaurantSettingsForm'

export default function RestaurantAdminDashboard() {
  const {
    user,
    logout,
    orders: allOrders,
    validateOrder,
    rejectOrder,
    updateOrderStatus,
    menuItems: allMenuItems,
    categories: allCategories,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addCategory,
    updateCategory,
    deleteCategory,
    updateRestaurant
  } = useAppStore()

  // Filter data for this restaurant
  // Use optional chaining and fallback
  const restaurantId = user?.restaurantId || '1'
  const { restaurants } = useAppStore()
  const currentRestaurant = restaurants.find(r => r.id === restaurantId)

  // Pending Orders Count
  const pendingOrdersCount = allOrders.filter(o => o.restaurantId === restaurantId && o.status === 'PENDING').length

  // Track previous pending count to trigger notifications only on new orders
  const [prevPendingCount, setPrevPendingCount] = useState(0)

  // ... (Notification effect fix)
  useEffect(() => {
    const currentPendingOrders = allOrders.filter(o => o.status === 'PENDING')
    const currentCount = currentPendingOrders.length

    // Initial load: just set the count, don't notify to avoid spam on refresh
    if (prevPendingCount === 0 && currentCount > 0) {
      setPrevPendingCount(currentCount)
      return
    }

    // New order detected
    if (currentCount > prevPendingCount) {
      const newCount = currentCount - prevPendingCount
      toast({
        title: "New Order Received!",
        description: `You have ${newCount} new pending order(s). Check the Orders tab.`,
        className: "bg-green-600 text-white border-none",
        duration: 5000,
      })
    }

    // Update count only if changed
    if (currentCount !== prevPendingCount) {
      setPrevPendingCount(currentCount)
    }

  }, [allOrders, prevPendingCount])

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const { helpdeskSettings, systemAnnouncements } = useAppStore()

  // Real Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [activeTab, setActiveTab] = useState('menu')

  // Fetch all data
  const [stats, setStats] = useState({
    totalMenuItems: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0,
    cancelledOrders: 0,
    cancelledRevenue: 0
  })

  // Report date filter state
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1)
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [chartData, setChartData] = useState<any>({})

  // Fetch all data
  const fetchDashboardData = useCallback(async () => {
    if (!restaurantId) return
    try {
      const [resMenu, resCat, resOrder, resPay, resReport] = await Promise.all([
        fetch(`/api/menu-items?restaurantId=${restaurantId}`),
        fetch(`/api/categories?restaurantId=${restaurantId}`),
        fetch(`/api/orders?restaurantId=${restaurantId}`),
        fetch(`/api/restaurants/${restaurantId}/payment-methods`),
        fetch(`/api/reports?restaurantId=${restaurantId}&year=${reportYear}&month=${reportMonth}`)
      ])

      const [dataMenu, dataCat, dataOrder, dataPay, dataReport] = await Promise.all([
        resMenu.json(), resCat.json(), resOrder.json(), resPay.json(), resReport.json()
      ])

      if (dataMenu.success) setMenuItems(dataMenu.data)
      if (dataCat.success) setCategories(dataCat.data)

      // Also refresh restaurant details if possible, or we might need a dedicated endpoint 
      // Current implementation might not be fetching restaurant details again?
      // Let's add that to ensure Slug is fresh.
      try {
        const resResto = await fetch(`/api/restaurants/${restaurantId}`)
        const dataResto = await resResto.json()
        if (dataResto.success) {
          useAppStore.getState().updateRestaurant(restaurantId, dataResto.data)
        }
      } catch (err) {
        console.error("Failed to refresh restaurant details", err)
      }
      if (dataOrder.success) setOrders(dataOrder.data)
      if (dataPay.success) setPaymentMethods(dataPay.data)
      if (dataReport.success) {
        setStats(dataReport.data.stats)
        setChartData(dataReport.data.dailyData)
      }

    } catch (e) { console.error("Sync Error", e) }
  }, [restaurantId, reportYear, reportMonth])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

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



  // Dialog states
  const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false)
  const [selectedMenuItemForQR, setSelectedMenuItemForQR] = useState<MenuItem | null>(null)

  // Form states
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [menuItemForm, setMenuItemForm] = useState<Partial<MenuItem>>({})
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({})
  const [paymentMethodForm, setPaymentMethodForm] = useState<Partial<PaymentMethod>>({})

  const handleSaveMenuItem = async () => {
    if (!menuItemForm.name || !menuItemForm.price || !menuItemForm.categoryId) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' })
      return
    }

    try {
      // Ensure price is a number and validated
      const price = parseFloat(menuItemForm.price as any)
      if (isNaN(price)) {
        toast({ title: 'Validation Error', description: 'Invalid price format', variant: 'destructive' })
        return
      }

      const payload = {
        ...menuItemForm,
        price: price, // Send as number
        restaurantId
      }
      let res

      if (editingMenuItem) {
        res = await fetch('/api/menu-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingMenuItem.id, ...payload })
        })
      } else {
        res = await fetch('/api/menu-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const data = await res.json()
      if (data.success) {
        await fetchDashboardData() // This refreshes ALL data including currentRestaurant if properly implemented
        setMenuItemDialogOpen(false)
        setMenuItemDialogOpen(false)
        setEditingMenuItem(null)
        setMenuItemForm({})
        toast({ title: 'Success', description: 'Menu item saved' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to save menu item' })
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      const res = await fetch(`/api/menu-items?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchDashboardData()
        toast({ title: 'Deleted', description: 'Menu item removed' })
      } else {
        throw new Error('Failed')
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to delete menu item' })
    }
  }



  // Legacy mock init removed. Real data only.

  const handleSavePaymentMethod = async () => {
    if (!paymentMethodForm.type) return

    try {
      let res
      if (paymentMethodForm.id) {
        // Edit
        res = await fetch(`/api/restaurants/${restaurantId}/payment-methods`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: paymentMethodForm.id,
            ...paymentMethodForm
          })
        })
      } else {
        // Create
        res = await fetch(`/api/restaurants/${restaurantId}/payment-methods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...paymentMethodForm,
            restaurantId: restaurantId
          })
        })
      }

      const data = await res.json()
      if (data.success) {
        setPaymentMethodDialogOpen(false)
        setPaymentMethodForm({})
        await fetchDashboardData()
        toast({ title: 'Success', description: 'Payment method saved' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to save payment method' })
    }
  }

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/payment-methods?paymentId=${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await fetchDashboardData()
        toast({ title: 'Deleted', description: 'Payment method removed' })
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to delete payment method' })
    }
  }

  // --- Multi-Branch Logic ---
  const [myBranches, setMyBranches] = useState<any[]>([])
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [branchForm, setBranchForm] = useState<any>({})

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/restaurants?adminId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMyBranches(data.data)
          }
        })
        .catch(console.error)
    }
  }, [user?.id, restaurantId])

  const handleCreateBranch = async () => {
    if (!branchForm.name) return

    try {
      const parentId = currentRestaurant?.parentId || restaurantId

      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...branchForm,
          adminId: user?.id,
          parentId: parentId,
          // New Admin Fields (only if entered)
          newAdminName: branchForm.createAdmin ? branchForm.newAdminName : undefined,
          newAdminEmail: branchForm.createAdmin ? branchForm.newAdminEmail : undefined,
          newAdminPassword: branchForm.createAdmin ? branchForm.newAdminPassword : undefined
        })
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: 'Branch created successfully' })
        setBranchDialogOpen(false)
        setBranchForm({})
        // Refresh branches
        const branchesRes = await fetch(`/api/restaurants?adminId=${user?.id}`)
        const branchesData = await branchesRes.json()
        if (branchesData.success) setMyBranches(branchesData.data)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', variant: 'destructive', description: error.message || 'Failed to create branch' })
    }
  }

  const handleTogglePaymentMethod = async (id: string, isActive: boolean) => {
    // Optimistic update
    const previous = [...paymentMethods]
    setPaymentMethods(curr => curr.map(p => p.id === id ? { ...p, isActive } : p))

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/payment-methods`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: id,
          isActive
        })
      })
      if (!res.ok) throw new Error('Failed')
      // No need to refetch full list if optimistic worked, but refetching ensures sync
      // await fetchPaymentMethods() 
    } catch (error) {
      setPaymentMethods(previous)
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to update status' })
    }
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return

    try {
      if (editingCategory) {
        // Update existing category
        const res = await fetch(`/api/categories`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, ...categoryForm })
        })
        const data = await res.json()
        if (data.success) {
          toast({ title: 'Success', description: 'Category updated' })
          await fetchDashboardData() // Refresh data
        } else {
          throw new Error(data.error)
        }
      } else {
        // Create new category
        const res = await fetch(`/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: categoryForm.name,
            description: categoryForm.description,
            restaurantId
          })
        })
        const data = await res.json()
        if (data.success) {
          toast({ title: 'Success', description: 'Category added' })
          await fetchDashboardData() // Refresh data
        } else {
          throw new Error(data.error)
        }
      }
      setCategoryDialogOpen(false)
      setEditingCategory(null)
      setCategoryForm({})
    } catch (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to save category'
      })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Deleted', description: 'Category removed' })
        await fetchDashboardData() // Refresh data
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to delete category'
      })
    }
  }

  // ... (keeping other handlers)

  // Order handlers - delegating to store
  const handleValidateOrder = (orderId: string) => {
    validateOrder(orderId)
    toast({ title: 'Success', description: 'Order has been validated and confirmed' })
  }

  const handleRejectOrder = (orderId: string) => {
    rejectOrder(orderId)
    toast({ title: 'Order Rejected', description: 'Order has been rejected' })
  }

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    updateOrderStatus(orderId, status)
    const statusText = status.replace('_', ' ').toLowerCase()
    toast({ title: 'Success', description: `Order status updated to ${statusText}` })
  }

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  const handleShowQRCode = (item: MenuItem) => {
    setSelectedMenuItemForQR(item)
    setQrCodeDialogOpen(true)
  }

  // Print Order Receipt Function
  const handlePrintOrder = (order: Order) => {
    const printContent = `
      <html>
        <head>
          <title>Order Receipt - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 10px; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .header h1 { font-size: 18px; margin: 5px 0; }
            .info { padding: 10px 0; border-bottom: 1px dashed #000; }
            .items { padding: 10px 0; border-bottom: 1px dashed #000; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-size: 14px; font-weight: bold; padding: 10px 0; text-align: right; }
            .footer { text-align: center; padding-top: 10px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${currentRestaurant?.name || 'Restaurant'}</h1>
            <p>Order: ${order.orderNumber}</p>
            <p>${new Date(order.createdAt).toLocaleString('id-ID')}</p>
          </div>
          <div class="info">
            <p>Customer: ${order.customerName}</p>
            <p>Table: ${order.tableNumber || '-'}</p>
            <p>Payment: ${order.paymentMethod}</p>
          </div>
          <div class="items">
            ${order.items.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.menuItemName}</span>
                <span>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <div class="item">
              <span>TOTAL:</span>
              <span>Rp ${order.totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div class="footer">
            <p>Terima Kasih atas Kunjungan Anda!</p>
            <p>Powered by Meenuin</p>
          </div>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
    toast({ title: 'Printing', description: 'Receipt sent to printer' })
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

  const getOrderStatusBadge = (status: Order['status']) => {
    const statusConfig: Record<Order['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pending', variant: 'default' },
      CONFIRMED: { label: 'Confirmed', variant: 'secondary' },
      PREPARING: { label: 'Preparing', variant: 'secondary' },
      READY: { label: 'Ready', variant: 'default' },
      COMPLETED: { label: 'Completed', variant: 'secondary' },
      CANCELLED: { label: 'Cancelled', variant: 'destructive' }
    }
    return statusConfig[status]
  }

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    const statusConfig: Record<Order['paymentStatus'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pending', variant: 'outline' },
      PAID: { label: 'Paid', variant: 'secondary' },
      FAILED: { label: 'Failed', variant: 'destructive' }
    }
    return statusConfig[status]
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden w-full">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  Meenuin
                  <Badge variant="secondary" className="text-[10px] h-5 hidden sm:inline-flex">
                    {currentRestaurant?.package || 'BASIC'}
                  </Badge>
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Restaurant Admin</p>
                  <Badge variant="outline" className="text-[10px] h-4 sm:hidden bg-emerald-100 text-emerald-800 border-emerald-200">
                    {currentRestaurant?.package || 'BASIC'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setQrCodeDialogOpen(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                QR Menu
              </Button>
              <Button variant="outline" size="icon" className="sm:hidden relative" onClick={() => setQrCodeDialogOpen(true)}>
                <QrCode className="h-4 w-4" />
              </Button>

              {/* Mobile Orders Icon Button */}
              <Button variant="outline" size="icon" className="sm:hidden relative" onClick={() => setActiveTab('orders')}>
                <ShoppingBag className="h-4 w-4" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                    {pendingOrdersCount}
                  </span>
                )}
              </Button>

              <Button variant="outline" size="sm" className="hidden sm:flex relative" onClick={() => setActiveTab('orders')}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Orders
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                    {pendingOrdersCount}
                  </span>
                )}
              </Button>

              <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.open(`https://wa.me/${helpdeskSettings?.whatsapp || '6281234567890'}`, '_blank')}>
                <LifeBuoy className="h-4 w-4 mr-2" />
                Helpdesk
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMenuItems}</div>
              <p className="text-xs text-gray-500">Active items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <LayoutGrid className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-xs text-gray-500">Menu categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-gray-500">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">Rp {stats.totalRevenue.toLocaleString('id-ID')}</div>
              <p className="text-xs text-gray-500">Gross validated revenue</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/10 border-red-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">Rp {stats.cancelledRevenue.toLocaleString('id-ID')}</div>
              <p className="text-xs text-red-600/70">{stats.cancelledOrders} orders cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Floating Helpdesk Button */}
        <Button
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 z-50 p-0"
          onClick={() => window.open(`https://wa.me/${helpdeskSettings?.whatsapp || '6281234567890'}`, '_blank')}
          title="Chat Helpdesk"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>

        {/* System Announcements */}
        {(() => {
          console.log('Restaurant Admin - systemAnnouncements:', systemAnnouncements)
          if (systemAnnouncements && systemAnnouncements.length > 0) {
            console.log('First announcement:', systemAnnouncements[0])
            console.log('Is active?', systemAnnouncements[0].isActive)
          }
          return null
        })()}
        {/* System Announcements */}
        {systemAnnouncements && systemAnnouncements.length > 0 && systemAnnouncements[0].isActive && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200 relative">
            <MegaphoneIcon className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">System Announcement</AlertTitle>
            <AlertDescription className="text-yellow-700 pr-8">
              {systemAnnouncements[0].message}
            </AlertDescription>
            {/* Allow simple dismissal for current session if needed, but ideally controlled by SuperAdmin */}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="menu" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-auto min-w-full sm:w-auto sm:min-w-0">
              <TabsTrigger value="menu">
                <Package className="h-4 w-4 mr-2" />
                Menu
              </TabsTrigger>
              <TabsTrigger value="categories">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Orders
                {orders.some(o => o.status === 'PENDING') && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Menu Items Tab */}
          <TabsContent value="menu" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Menu Management</h2>
              <Dialog open={menuItemDialogOpen} onOpenChange={setMenuItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingMenuItem(null)
                    setMenuItemForm({})
                  }} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
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
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveMenuItem} className="bg-green-600 hover:bg-green-700">
                      {editingMenuItem ? 'Update' : 'Add'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="max-h-[600px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {menuItems.map((item) => (
                  <Card key={item.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                          <Badge variant="outline" className="text-xs mb-2">
                            {item.categoryName}
                          </Badge>
                          <CardDescription className="text-sm">{item.description}</CardDescription>
                        </div>
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={(checked) => {
                            updateMenuItem(item.id, { isAvailable: checked })
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-green-600">
                          Rp {item.price.toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleShowQRCode(item)}
                            variant="outline"
                            size="icon"
                            className="text-blue-600 hover:text-blue-700"
                            title="Show QR Code"
                          >
                            <QrCode className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMenuItem(item)
                              setMenuItemForm(item)
                              setMenuItemDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteMenuItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Categories</h2>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingCategory(null)
                    setCategoryForm({})
                  }} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
                    <DialogDescription>
                      {editingCategory ? 'Update category details' : 'Create a new category'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">Name *</Label>
                      <Input
                        id="category-name"
                        value={categoryForm.name || ''}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        placeholder="Category name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-description">Description</Label>
                      <Input
                        id="category-description"
                        value={categoryForm.description || ''}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        placeholder="Category description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveCategory} className="bg-green-600 hover:bg-green-700">
                      {editingCategory ? 'Update' : 'Add'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{category.name}</CardTitle>
                        <CardDescription className="text-sm">{category.description}</CardDescription>
                      </div>
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={(checked) => {
                          updateCategory(category.id, { isActive: checked })
                        }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category)
                          setCategoryForm(category)
                          setCategoryDialogOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Incoming Orders</h2>
            </div>
            <ScrollArea className="max-h-[600px] pr-4">
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <CardTitle className="text-base sm:text-lg">{order.orderNumber}</CardTitle>
                            <Badge {...getOrderStatusBadge(order.status)}>
                              {getOrderStatusBadge(order.status).label}
                            </Badge>
                            <Badge {...getPaymentStatusBadge(order.paymentStatus)}>
                              {getPaymentStatusBadge(order.paymentStatus).label}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs sm:text-sm space-y-1">
                            <p><span className="font-medium">Customer:</span> {order.customerName}</p>
                            <p><span className="font-medium">Payment:</span> {getPaymentMethodIcon(order.paymentMethod)} {order.paymentMethod}</p>
                            {order.tableNumber && <p><span className="font-medium">Table:</span> {order.tableNumber}</p>}
                            <p><span className="font-medium">Total:</span> <span className="font-bold text-green-600">Rp {order.totalAmount.toLocaleString()}</span></p>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                          <Button variant="outline" size="icon" onClick={() => handlePrintOrder(order)} title="Print Receipt">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Order Items */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs sm:text-sm font-medium mb-2">Order Items:</p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-xs sm:text-sm">
                                <span>{item.menuItemName} x {item.quantity}</span>
                                <span className="font-semibold">Rp {(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <p className="text-sm"><span className="font-medium">Notes:</span> {order.notes}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {order.status === 'PENDING' && (
                            <>
                              <Button
                                onClick={() => handleValidateOrder(order.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Validate
                              </Button>
                              <Button
                                onClick={() => handleRejectOrder(order.id)}
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <>
                              <Button
                                onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                                variant="outline"
                                className="flex-1"
                              >
                                Start Preparing
                              </Button>
                            </>
                          )}
                          {order.status === 'PREPARING' && (
                            <>
                              <Button
                                onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                                variant="outline"
                                className="flex-1"
                              >
                                Mark as Ready
                              </Button>
                            </>
                          )}
                          {order.status === 'READY' && (
                            <>
                              <Button
                                onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                                variant="outline"
                                className="flex-1"
                              >
                                Mark as Completed
                              </Button>
                            </>
                          )}
                          {order.status === 'COMPLETED' && (
                            <div className="flex-1 text-center text-sm text-green-600 font-medium">
                              <CheckCircle className="h-4 w-4 inline mr-1" />
                              Order Completed
                            </div>
                          )}
                          {order.status === 'CANCELLED' && (
                            <div className="flex-1 text-center text-sm text-red-600 font-medium">
                              <XCircle className="h-4 w-4 inline mr-1" />
                              Order Cancelled
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Daily Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">
                    Rp {(stats.totalRevenue * 0.1).toLocaleString('id-ID')}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Today&apos;s earnings</p>
                  <div className="mt-4 flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +12% from yesterday
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    Rp {(stats.totalRevenue * 0.45).toLocaleString('id-ID')}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">This week&apos;s total</p>
                  <div className="mt-4 flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +8% from last week
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    Rp {stats.totalRevenue.toLocaleString('id-ID')}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">This month&apos;s total</p>
                  <div className="mt-4 flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +15% from last month
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {orders.filter(o => o.status === 'PENDING').length}
                    </div>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {orders.filter(o => o.status === 'PREPARING').length}
                    </div>
                    <p className="text-sm text-gray-500">Preparing</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {orders.filter(o => o.status === 'COMPLETED').length}
                    </div>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {orders.filter(o => o.status === 'CANCELLED').length}
                    </div>
                    <p className="text-sm text-gray-500">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Menu Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Menu Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {menuItems.slice(0, 5).map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-emerald-600 font-bold">Rp {item.price.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['QRIS', 'GOPAY', 'DANA', 'CASH', 'OVO'].map((method, idx) => {
                    const count = orders.filter(o => o.paymentMethod === method).length
                    const total = orders.filter(o => o.paymentMethod === method).reduce((acc, o) => acc + o.totalAmount, 0)
                    return (
                      <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                          <span className="font-medium">{method}</span>
                          <Badge variant="outline" className="text-xs">{count} orders</Badge>
                        </div>
                        <span className="text-emerald-600 font-bold">Rp {total.toLocaleString('id-ID')}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Payment Methods</h2>
              <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setPaymentMethodForm({})} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </DialogTrigger>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{getPaymentMethodIcon(method.type)}</div>
                        <div>
                          <CardTitle className="text-lg">{method.type}</CardTitle>
                          {method.merchantId && (
                            <CardDescription className="text-sm">
                              ID: {method.merchantId}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={method.isActive}
                        onCheckedChange={(checked) => handleTogglePaymentMethod(method.id, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 w-full"
                      onClick={() => handleDeletePaymentMethod(method.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => {
                      setPaymentMethodForm(method)
                      setPaymentMethodDialogOpen(true)
                    }}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Restaurant Settings</h2>
              <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setBranchForm({})}>
                    <Plus className="mr-2 h-4 w-4" /> Create Branch
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Branch</DialogTitle>
                    <DialogDescription>Create a new outlet linked to this restaurant.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Branch Name</Label>
                      <Input
                        placeholder="e.g. Cabang Jakarta Selatan"
                        value={branchForm.name || ''}
                        onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        placeholder="Full address"
                        value={branchForm.address || ''}
                        onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="081..."
                        value={branchForm.phone || ''}
                        onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="border-t pt-4 mt-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          id="createAdmin"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          checked={branchForm.createAdmin || false}
                          onChange={(e) => setBranchForm({ ...branchForm, createAdmin: e.target.checked })}
                        />
                        <Label htmlFor="createAdmin" className="cursor-pointer font-medium">Create Separate Admin for Branch?</Label>
                      </div>

                      {branchForm.createAdmin && (
                        <div className="space-y-3 pl-2 border-l-2 border-emerald-100 bg-emerald-50/50 p-3 rounded">
                          <div className="space-y-1">
                            <Label>Admin Name</Label>
                            <Input
                              placeholder="Branch Manager Name"
                              value={branchForm.newAdminName || ''}
                              onChange={(e) => setBranchForm({ ...branchForm, newAdminName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Admin Email</Label>
                            <Input
                              type="email"
                              placeholder="manager@branch.com"
                              value={branchForm.newAdminEmail || ''}
                              onChange={(e) => setBranchForm({ ...branchForm, newAdminEmail: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Password</Label>
                            <Input
                              type="password"
                              placeholder="******"
                              value={branchForm.newAdminPassword || ''}
                              onChange={(e) => setBranchForm({ ...branchForm, newAdminPassword: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="Phone number"
                        value={branchForm.phone || ''}
                        onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBranchDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateBranch}>Create Branch</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {myBranches.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>My Branches</CardTitle>
                  <CardDescription>Switch between your restaurant outlets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myBranches.map(branch => (
                      <Button
                        key={branch.id}
                        variant={branch.id === restaurantId ? "default" : "outline"}
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => window.location.href = `?restaurantId=${branch.id}`} // Simple reload to switch context
                      >
                        <div className="text-left">
                          <div className="font-semibold">{branch.name}</div>
                          <div className="text-xs opacity-70">{branch.address}</div>
                        </div>
                        {branch.id === restaurantId && <CheckCircle className="ml-auto h-4 w-4" />}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <RestaurantSettingsForm restaurantId={restaurantId} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Sales Reports</h2>
              <div className="flex items-center gap-2">
                <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={m.toString()}>
                        {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => toast({ title: 'Downloading...', description: 'Report download started.' })}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.filter(o => {
                      const d = new Date(o.createdAt);
                      return d.getMonth() + 1 === reportMonth && d.getFullYear() === reportYear;
                    }).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Gross Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    Rp {orders.filter(o => {
                      const d = new Date(o.createdAt);
                      return d.getMonth() + 1 === reportMonth && d.getFullYear() === reportYear;
                    }).reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString('id-ID')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rp {(() => {
                      const filtered = orders.filter(o => {
                        const d = new Date(o.createdAt);
                        return d.getMonth() + 1 === reportMonth && d.getFullYear() === reportYear;
                      });
                      return filtered.length ? (filtered.reduce((acc, o) => acc + o.totalAmount, 0) / filtered.length).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '0';
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Breakdown</CardTitle>
                <CardDescription>
                  Sales performance for {new Date(0, reportMonth - 1).toLocaleString('default', { month: 'long' })} {reportYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <div className="grid grid-cols-4 bg-gray-50 p-3 font-medium text-sm border-b">
                    <div>Date</div>
                    <div>Orders</div>
                    <div>Items Sold</div>
                    <div className="text-right">Revenue</div>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {Object.entries(chartData).map(([date, data]: [string, any]) => (
                      <div key={date} className="grid grid-cols-4 p-3 text-sm border-b last:border-0 hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {date}
                        </div>
                        <div>{data.count}</div>
                        <div>-</div>
                        <div className="text-right font-medium">Rp {data.revenue.toLocaleString('id-ID')}</div>
                      </div>
                    ))}
                    {Object.keys(chartData).length === 0 && (
                      <div className="p-8 text-center text-gray-500">No sales data for this period</div>
                    )}


                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs >
      </main >

      {/* Mobile Bottom Navigation */}
      < div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 z-50 grid grid-cols-4 gap-1" >
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${activeTab === 'menu' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
        >
          <Package className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-1">Menu</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${activeTab === 'categories' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-1">Category</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${activeTab === 'orders' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-1">Orders</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${activeTab === 'settings' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-1">Settings</span>
        </button>
      </div >

      {/* Footer */}
      < footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-auto" >
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            © 2024 RestoHub. Digital Restaurant Platform
          </p>
        </div>
      </footer >

      {/* QR Code Dialog for Restaurant Menu */}
      < QRCodeDialog
        open={qrCodeDialogOpen}
        onOpenChange={setQrCodeDialogOpen}
        restaurantSlug={currentRestaurant?.slug || currentRestaurant?.id || restaurantId}
        restaurantName={currentRestaurant?.name || 'Restaurant'}
      />
    </div>
  )
}

