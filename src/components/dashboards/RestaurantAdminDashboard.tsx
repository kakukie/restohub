'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { translations, useTranslation } from '@/lib/i18n'
import { useAppStore, MenuItem, Category, PaymentMethod, Order } from '@/store/app-store'
import { BarChart3, Users, Utensils, DollarSign, LogOut, Plus, Edit, Trash2, Search, ArrowUpRight, ArrowDownRight, Shield, Save, CheckCircle, Smartphone, Megaphone, Building2, Store, TrendingUp, ShoppingBag, Zap, MoreHorizontal, Filter, X, QrCode, Printer, MessageCircle, FileText, Download, Calendar, LifeBuoy, ChefHat, Package, LayoutGrid, Clock, XCircle, CreditCard, Sun, Moon, Languages, RefreshCw, Wallet, Settings } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'
import QRCodeDialog from '@/components/common/QRCodeDialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Megaphone as MegaphoneIcon } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import RestaurantSettingsForm from './forms/RestaurantSettingsForm'
import { LanguageToggle } from '@/components/common/LanguageToggle'

interface OrderItem {
  menuItemId: string
  menuItemName: string
  price: number
  quantity: number
  categoryName?: string
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
    systemAnnouncements,
    language, // Get language from store
    setLanguage, // Get setter if needed for toggle
    updateRestaurant
  } = useAppStore()

  // i18n Helper - Fix: Use the hook to get the function, not the object
  const getTranslation = useTranslation(language as 'en' | 'id' || 'en');
  const t = (key: string) => getTranslation(key as any);

  // Loading State
  const [isLoading, setIsLoading] = useState(true)
  // Hydration check to prevent session loss on refresh
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  const { theme, setTheme } = useTheme()

  // Derived state
  const restaurantId = user?.restaurantId
  const currentRestaurant = restaurants.find(r => r.id === restaurantId)
  const pendingOrdersCount = orders ? orders.filter(o => o.status === 'PENDING').length : 0

  const [prevPendingCount, setPrevPendingCount] = useState(0)

  // Printer State
  const [printerCharacteristic, setPrinterCharacteristic] = useState<any>(null)
  const [isPrinterConnected, setIsPrinterConnected] = useState(false)

  const handleConnectPrinter = async () => {
    try {
      const { characteristic } = await connectToPrinter()
      setPrinterCharacteristic(characteristic)
      setIsPrinterConnected(true)
      toast({ title: "Connected", description: "Printer connected successfully" })
    } catch (e) {
      toast({ title: "Error", description: "Failed to connect printer", variant: "destructive" })
    }
  }

  const handlePrintOrder = async (order: Order) => {
    if (!printerCharacteristic) {
      toast({ title: "Printer not connected", description: "Please connect printer in Settings", variant: "destructive" })
      return
    }
    try {
      await printReceipt(printerCharacteristic, order, currentRestaurant?.name || 'Restaurant')
      toast({ title: "Printed", description: "Order sent to printer" })
    } catch (e) {
      toast({ title: "Error", description: "Failed to print", variant: "destructive" })
    }
  }

  // Unified Settings Form State
  const [settingsForm, setSettingsForm] = useState<Partial<Restaurant>>({})

  useEffect(() => {
    if (currentRestaurant) {
      setSettingsForm({
        name: currentRestaurant.name || '',
        address: currentRestaurant.address || '',
        phone: currentRestaurant.phone || '',
        slug: currentRestaurant.slug || '',
        googleMapsUrl: currentRestaurant.googleMapsUrl || '',
        latitude: currentRestaurant.latitude || 0,
        longitude: currentRestaurant.longitude || 0,
        allowMaps: currentRestaurant.allowMaps || false,
      })
    }
  }, [currentRestaurant])

  // ... (sound effect code)

  // ... (state definitions)


  useEffect(() => {
    if (pendingOrdersCount > prevPendingCount) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audio.play().catch(e => console.log('Audio play failed:', e))
    }
    if (pendingOrdersCount !== prevPendingCount) {
      setPrevPendingCount(pendingOrdersCount)
    }
  }, [pendingOrdersCount, prevPendingCount])

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [activeTab, setActiveTab] = useState('menu')
  const [searchQuery, setSearchQuery] = useState('')

  const [reportStats, setReportStats] = useState({
    totalMenuItems: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0,
    itemsSold: 0,
    cancelledOrders: 0,
    cancelledRevenue: 0
  })
  const [reportDailyData, setReportDailyData] = useState<any>({})

  const [topMenuItems, setTopMenuItems] = useState<any[]>([])
  const [topPaymentMethods, setTopPaymentMethods] = useState<any[]>([])

  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1)
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [reportFilterType, setReportFilterType] = useState<'monthly' | 'custom'>('monthly')
  const [reportDateRange, setReportDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [reportStatusFilter, setReportStatusFilter] = useState('COMPLETED')

  const [viewOrder, setViewOrder] = useState<Order | null>(null)


  // Unified Order List State
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [orderFilterStatus, setOrderFilterStatus] = useState('ALL')
  const [orderDateRange, setOrderDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default last 7 days
    end: new Date().toISOString().split('T')[0]
  })

  const [activeAnnouncements, setActiveAnnouncements] = useState<any[]>([])

  const loadMenuData = useCallback(async () => {
    if (!restaurantId) return
    const ts = new Date().getTime()
    try {
      const [resMenu, resCat, resPay] = await Promise.all([
        fetch(`/api/menu-items?restaurantId=${restaurantId}&_t=${ts}`),
        fetch(`/api/categories?restaurantId=${restaurantId}&_t=${ts}`),
        fetch(`/api/restaurants/${restaurantId}/payment-methods?_t=${ts}`)
      ])
      const [dataMenu, dataCat, dataPay] = await Promise.all([resMenu.json(), resCat.json(), resPay.json()])

      if (dataMenu.success) setMenuItems(dataMenu.data || [])
      if (dataCat.success) setCategories(dataCat.data || [])
      if (dataPay.success) setPaymentMethods(dataPay.data || [])
    } catch (e) {
      console.error("Menu Load Error", e)
    }
  }, [restaurantId])

  const loadOrderData = useCallback(async () => {
    if (!restaurantId) return
    const ts = new Date().getTime()
    try {
      const [resOrder, resOrderItems] = await Promise.all([
        fetch(`/api/orders?restaurantId=${restaurantId}&_t=${ts}`),
        fetch(`/api/order-items?restaurantId=${restaurantId}&_t=${ts}`)
      ])
      const [dataOrder, dataOrderItems] = await Promise.all([resOrder.json(), resOrderItems.json()])

      if (dataOrder.success) setOrders(dataOrder.data || [])
      // resOrderItems not used currently but fetched for cache/potential usage
    } catch (e) {
      console.error("Order Load Error", e)
    }
  }, [restaurantId])

  const loadReportData = useCallback(async () => {
    if (!restaurantId) return
    const ts = new Date().getTime()
    try {
      let startDate, endDate
      if (reportFilterType === 'monthly') {
        startDate = new Date(reportYear, reportMonth - 1, 1)
        endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59, 999)
      } else {
        startDate = new Date(reportDateRange.start)
        endDate = new Date(reportDateRange.end)
        endDate.setHours(23, 59, 59, 999)
      }

      const resReport = await fetch(`/api/reports?restaurantId=${restaurantId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&status=${reportStatusFilter}&_t=${ts}`)
      const dataReport = await resReport.json()

      if (dataReport.success) {
        setReportStats(dataReport.data.stats || {})
        setReportDailyData(dataReport.data.daily || dataReport.data.chartData || {})
        setTopMenuItems(dataReport.data.topMenuItems || [])
        setTopPaymentMethods(dataReport.data.topPaymentMethods || [])
      }
    } catch (e) {
      console.error("Report Load Error", e)
    }
  }, [restaurantId, reportYear, reportMonth, reportFilterType, reportDateRange, reportStatusFilter])

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`/api/announcements?active=true&_t=${new Date().getTime()}`)
      const data = await res.json()
      if (data.success) setActiveAnnouncements(data.data || [])
    } catch (e) { }
  }, [])

  const loadRestaurantDetails = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}?_t=${new Date().getTime()}`);
      const data = await res.json();
      if (data.success && data.data) {
        // Update store using updateRestaurant action
        updateRestaurant(restaurantId, data.data);
      }
    } catch (e) { console.error("Resto Detail Error", e); }
  }, [restaurantId, updateRestaurant]);

  // Monolith wrapper for Manual Refresh
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([
      fetchRestaurantDetails(), // Sync details
      loadMenuData(),
      loadOrderData(),
      loadReportData(),
      loadAnnouncements(),
      loadRestaurantDetails()
    ])
    setIsLoading(false)
  }, [loadMenuData, loadOrderData, loadReportData, loadAnnouncements, loadRestaurantDetails])

  // Initial Load (Parallel)
  useEffect(() => {
    if (restaurantId) {
      // Fire all independently for faster perception (progressive loading)
      loadRestaurantDetails() // Sync latest limits/slug
      loadMenuData()
      loadOrderData()
      loadReportData()
      loadReportData()
      loadAnnouncements()
    }
  }, [restaurantId, loadMenuData, loadOrderData, loadReportData, loadAnnouncements])

  // Fix: Sync Settings Form when currentRestaurant loads
  useEffect(() => {
    if (currentRestaurant) {
      setSettingsForm({
        name: currentRestaurant.name,
        description: currentRestaurant.description,
        address: currentRestaurant.address,
        phone: currentRestaurant.phone,
        email: currentRestaurant.email,
        slug: currentRestaurant.slug,
        theme: currentRestaurant.theme,
        detailAddress: currentRestaurant.detailAddress,
        googleMapsUrl: currentRestaurant.googleMapsUrl,
        printerSettings: currentRestaurant.printerSettings
      })
    }
  }, [currentRestaurant])

  // Polling (Orders ONLY)
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrderData()
    }, 15000)
    return () => clearInterval(interval)
  }, [loadOrderData])

  // Sync Reports when tab is verified
  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'reports') {
      loadReportData()
    }
  }, [activeTab, loadReportData])

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

  // Manual Notification States
  const [validateOrderId, setValidateOrderId] = useState<string | null>(null)
  const [manualEmail, setManualEmail] = useState('')
  const [manualPhone, setManualPhone] = useState('')

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
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' })
      return
    }

    try {
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
        // Targeted refresh instead of full dashboard sync
        const resRefresh = await fetch(`/api/menu-items?restaurantId=${restaurantId}`)
        const dataRefresh = await resRefresh.json()
        if (dataRefresh.success) setMenuItems(dataRefresh.data)

        if (!editingMenuItem) {
          setReportStats(prev => ({ ...prev, totalMenuItems: prev.totalMenuItems + 1 }))
        }

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
          enableSync: branchForm.enableSync,
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
      let res;
      if (editingCategory) {
        // Update existing category
        res = await fetch(`/api/categories`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, ...categoryForm })
        })
      } else {
        // Create new category
        res = await fetch(`/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: categoryForm.name,
            description: categoryForm.description,
            restaurantId
          })
        })
      }

      const data = await res.json()
      if (data.success) {
        toast({ title: 'Success', description: 'Category saved' })

        // Optimistic / Faster Update
        if (editingCategory) {
          setCategories(prev => prev.map(c => c.id === editingCategory.id ? data.data : c))
        } else {
          setCategories(prev => [...prev, data.data])
          setReportStats(prev => ({ ...prev, totalCategories: (prev.totalCategories || 0) + 1 }))
        }
        // Background sync
        loadMenuData()
      } else {
        throw new Error(data.error)
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
    if (!confirm(t('deleteConfirm'))) return;

    // Optimistic Update
    const prevCategories = [...categories]
    setCategories(prev => prev.filter(c => c.id !== id))
    setReportStats(prev => ({ ...prev, totalCategories: Math.max(0, (prev.totalCategories || 0) - 1) }))

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Deleted', description: 'Category removed' })
        loadMenuData() // Background sync
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      // Revert if failed
      setCategories(prevCategories)
      loadReportData()
      toast({
        title: 'Error',
        variant: 'destructive',
        description: 'Failed to delete category'
      })
    }
  }

  // ... (keeping other handlers)

  const handleValidateOrder = async () => {
    if (!validateOrderId) return
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: validateOrderId,
          status: 'CONFIRMED',
          // Pass manual notification details
          manualEmail: manualEmail || undefined,
          manualPhone: manualPhone || undefined
        })
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Order has been validated and confirmed' })
        setValidateOrderId(null)
        setManualEmail('')
        setManualPhone('')
        await fetchDashboardData()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to validate order' })
    }
  }

  const handleRejectOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'CANCELLED' })
      })
      if (res.ok) {
        toast({ title: 'Order Rejected', description: 'Order has been rejected' })
        await fetchDashboardData()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to reject order' })
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      })
      if (res.ok) {
        const statusText = status.replace('_', ' ').toLowerCase()
        toast({ title: 'Success', description: `Order status updated to ${statusText}` })
        await fetchDashboardData()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to update status' })
    }
  }

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  const handleShowQRCode = (item: MenuItem) => {
    setSelectedMenuItemForQR(item)
    setQrCodeDialogOpen(true)
  }

  const handleDownloadReport = () => {
    // Filter orders by selected month/year
    const filteredOrders = orders.filter(o => {
      // Check date filter
      const d = new Date(o.createdAt);
      d.setHours(0, 0, 0, 0);

      let dateMatch = true;
      if (reportFilterType === 'monthly') {
        dateMatch = d.getMonth() + 1 === reportMonth && d.getFullYear() === reportYear;
      } else {
        const start = new Date(reportDateRange.start);
        const end = new Date(reportDateRange.end);
        end.setHours(23, 59, 59, 999);
        dateMatch = d >= start && d <= end;
      }
      return dateMatch;
    });

    if (filteredOrders.length === 0) {
      toast({ title: 'No Data', description: 'No orders found for this period', variant: 'destructive' })
      return
    }

    const headers = ['Order No', 'Date', 'Status', 'Total Amount', 'Payment Status', 'Customer Name']
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      o.status,
      o.totalAmount.toString(),
      o.paymentStatus,
      o.customerName || 'Guest'
    ])

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `report_${currentRestaurant?.name || 'export'}_${reportMonth}_${reportYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({ title: 'Success', description: 'Report downloaded successfully' })
  }

  // Print Order Receipt Function
  const handlePrintOrder = (order: Order) => {
    const printContent = `
      <html>
        <head>
          <title>Order #${order.orderNumber}</title>
          <style>
            @media print {
              @page { size: 58mm auto; margin: 0mm; }
              body { margin: 0; padding: 5px; width: 58mm; text-align: left; }
              /* Force generic font for thermal printers compatibility */
              * { font-family: 'Courier New', monospace !important; }
            }
            body { font-family: 'Courier New', monospace; font-size: 10px; width: 58mm; margin: 0 auto; color: #000; background: #fff; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { font-size: 16px; margin: 0; font-weight: bold; text-transform: uppercase; }
            .info { font-size: 10px; margin-bottom: 10px; }
            .info p { margin: 2px 0; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .item-details { display: flex; flex-direction: column; width: 100%; }
            .item-row { display: flex; justify-content: space-between; width: 100%; }
            .item-name { font-weight: bold; }
            .item-qty { min-width: 20px; }
            .notes { font-size: 10px; font-style: italic; margin-left: 20px; }
            .total { margin-top: 10px; font-weight: bold; border-bottom: 1px double #000; padding-bottom: 10px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${currentRestaurant?.name || 'MEENUIN'}</h1>
            <p>${currentRestaurant?.address || ''}</p>
          </div>
          <div class="info">
            <p>Order: #${order.orderNumber}</p>
            <p>Time: ${new Date(order.createdAt).toLocaleString('id-ID')}</p>
            <p>Cust: ${order.customerName}</p>
            <p>Table: ${order.tableNumber || 'N/A'}</p>
            <p>Pay: ${order.paymentMethod} (${order.paymentStatus})</p>
          </div>
          <div class="items">
            ${order.items.map(item => `
              <div class="item">
                <div class="item-details">
                   <div class="item-row">
                      <span class="item-qty">${item.quantity}x</span>
                      <span class="item-name">${item.menuItemName}</span>
                      <span>${(item.price * item.quantity).toLocaleString('id-ID')}</span>
                   </div>
                   ${item.notes ? `<div class="notes">Note: ${item.notes}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <div class="item-row" style="display:flex; justify-content:space-between">
              <span>TOTAL</span>
              <span>Rp ${order.totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div class="footer">
            <p>Terima Kasih!</p>
            <p>Powered by Meenuin</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `
    const printWindow = window.open('', '', 'width=300,height=600')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      // Delay print to ensure rendering
      setTimeout(() => {
        printWindow.print()
        // Optional: Close after a delay, but leaving it open is safer for mobile
        // setTimeout(() => printWindow.close(), 1000)
      }, 500)
    }
    toast({ title: 'Printing', description: 'Receipt sent to printer' })
  }

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'QRIS': return <QrCode className="h-8 w-8 text-blue-600" />
      case 'GOPAY': return <Wallet className="h-8 w-8 text-green-600" />
      case 'OVO': return <Wallet className="h-8 w-8 text-purple-600" /> // Wallet generic
      case 'DANA': return <Wallet className="h-8 w-8 text-blue-400" />
      case 'SHOPEEPAY': return <ShoppingBag className="h-8 w-8 text-orange-500" />
      case 'CASH': return <DollarSign className="h-8 w-8 text-green-700" />
      default: return <CreditCard className="h-8 w-8 text-gray-600" />
    }
  }

  const getOrderStatusBadge = (status: Order['status']) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pending', variant: 'default' },
      CONFIRMED: { label: 'Confirmed', variant: 'secondary' },
      PREPARING: { label: 'Preparing', variant: 'secondary' },
      READY: { label: 'Ready', variant: 'default' },
      COMPLETED: { label: 'Completed', variant: 'secondary' },
      CANCELLED: { label: 'Cancelled', variant: 'destructive' },
      REJECTED: { label: 'Rejected', variant: 'destructive' } // Added REJECTED status
    }
    return statusConfig[status] || { label: status, variant: 'outline' }
  }

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    const statusConfig: Record<Order['paymentStatus'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING: { label: 'Pending', variant: 'outline' },
      PAID: { label: 'Paid', variant: 'secondary' },
      FAILED: { label: 'Failed', variant: 'destructive' }
    }
    return statusConfig[status]
  }

  if (!hydrated) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-x-hidden w-full">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  {currentRestaurant?.name || 'Meenuin'}
                  <div className="flex flex-col items-start ml-2">
                    <Badge variant="secondary" className="text-[10px] h-5 hidden sm:inline-flex bg-purple-100 text-purple-700 border-purple-200">
                      {currentRestaurant?.package === 'FREE_TRIAL' ? 'Free Trial' :
                        currentRestaurant?.package === 'PRO' ? 'Pro' :
                          currentRestaurant?.package === 'ENTERPRISE' ? 'Enterprise' : 'Basic'} Plan
                    </Badge>
                  </div>
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 hidden sm:inline-block">
                    {menuItems.length} / {currentRestaurant?.maxMenuItems || '15'} Items
                  </span>
                  <Badge variant="outline" className="text-[10px] h-4 sm:hidden bg-purple-100 text-purple-700 border-purple-200">
                    {currentRestaurant?.package === 'FREE_TRIAL' ? 'Free' : (currentRestaurant?.package || 'Basic')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Desktop Actions */}
              {/* Desktop Actions */}
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShowQRCode(currentRestaurant?.menuItems?.[0] || {} as any)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  {t('qrCode')}
                </Button>
                <LanguageToggle />
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('logout')}
                </Button>
              </div>
            </div>

            {/* Status Filter for Report - REMOVED per user request */}
            {/* Mobile Actions (Dropdown) */}
            <div className="sm:hidden flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setQrCodeDialogOpen(true)}>
                    <QrCode className="h-4 w-4 mr-2" />
                    {t('qrCode')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                    {t('theme')}
                  </DropdownMenuItem>
                  {/* Language Toggle is complex to embed as item, so maybe keep it out or custom item */}
                  {/* Using a simple toggle for mobile logic if possible, or just standard Items */}
                  <DropdownMenuItem onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}>
                    <Languages className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Bahasa Indonesia' : 'English'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto w-full px-4 py-8 pb-32 flex-1">

        {/* System Announcements */}
        {/* System Announcements */}
        {
          activeAnnouncements.map((announcement: any) => (
            <Alert key={announcement.id} className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
              <MegaphoneIcon className="h-4 w-4" />
              <AlertTitle>{t('systemBroadcast')}</AlertTitle>
              <AlertDescription>{announcement.message}</AlertDescription>
            </Alert>
          ))
        }

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('itemsSold')}</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportStats.itemsSold || 0}</div>
              <p className="text-xs text-gray-500">{t('itemsSold')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('categories')}</CardTitle>
              <LayoutGrid className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportStats.totalCategories || 0}</div>
              <p className="text-xs text-gray-500">{t('menuCategories')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
              <ShoppingBag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportStats.totalOrders || 0}</div>
              <p className="text-xs text-gray-500">{t('thisMonth')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">Rp {(reportStats.totalRevenue || 0).toLocaleString('id-ID')}</div>
              <p className="text-xs text-gray-500">{t('grossValidatedRevenue')}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/10 border-red-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">{t('cancelled')}</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">Rp {(reportStats.cancelledRevenue || 0).toLocaleString('id-ID')}</div>
              <p className="text-xs text-red-600/70">{reportStats.cancelledOrders || 0} {t('cancelled')}</p>
            </CardContent>
          </Card>
        </div>

        {/* System Announcements */}


        {/* Tabs */}
        <Tabs defaultValue="menu" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Mobile-Friendly TabsList: Removed justify-center on mobile, kept overflow-x-auto on parent */}
            <TabsList className="inline-flex h-10 items-center justify-start md:justify-center rounded-md bg-muted p-1 text-muted-foreground w-auto whitespace-nowrap">
              <TabsTrigger value="menu">
                <Package className="h-4 w-4 mr-2" />
                {t('menu')}
              </TabsTrigger>
              <TabsTrigger value="categories">
                <LayoutGrid className="h-4 w-4 mr-2" />
                {t('categories')}
              </TabsTrigger>
              <TabsTrigger value="orders" className="relative overflow-visible">
                <ShoppingBag className="h-4 w-4 mr-2" />
                {t('orders')}
                {orders.filter(o => o.status === 'PENDING').length > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-bold border-2 border-white shadow-sm z-10 transition-transform">
                    {orders.filter(o => o.status === 'PENDING').length > 99 ? '99+' : orders.filter(o => o.status === 'PENDING').length}
                  </span>
                )}
              </TabsTrigger>
              {/* Analytics Merged into Reports */}
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2" />
                {t('paymentMethods')}
              </TabsTrigger>

              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                {t('settings')}
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <FileText className="h-4 w-4 mr-2" />
                {t('reports')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Menu Items Tab */}
          <TabsContent value="menu" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <h2 className="text-2xl font-bold tracking-tight">{t('menuManagement')}</h2>
                <nav className="flex items-center text-sm text-muted-foreground">
                  <span className="hover:text-foreground transition-colors cursor-pointer">Dashboard</span>
                  <span className="mx-2 text-muted-foreground/50">/</span>
                  <span className="font-medium text-foreground">Menu</span>
                  <span className="mx-2 text-muted-foreground/50">/</span>
                  <span className={(reportStats.totalMenuItems || 0) >= (currentRestaurant?.maxMenuItems || 10) ? 'text-red-500 font-bold' : 'text-emerald-600 font-medium'}>
                    {reportStats.totalMenuItems || 0} / {currentRestaurant?.maxMenuItems || 10} Items
                  </span>
                </nav>
                <div className="mt-4 w-full sm:w-[300px]">
                  <div className="relative">
                    <Utensils className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search menu..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
                {(reportStats.totalMenuItems || 0) >= (currentRestaurant?.maxMenuItems || 10) && (
                  <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">Limit Reached</span>
                )}
                <Dialog open={menuItemDialogOpen} onOpenChange={setMenuItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingMenuItem(null)
                        setMenuItemForm({})
                      }}
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      disabled={(reportStats.totalMenuItems || 0) >= (currentRestaurant?.maxMenuItems || 10)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('addItem')}
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
              </div>
            </div >

            <ScrollArea className="h-[calc(100vh-280px)] sm:h-[600px] w-full rounded-md border p-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {menuItems
                  .filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((item) => (
                    <Card key={item.id} className="border-2 flex flex-col sm:flex-row overflow-hidden">
                      {item.image && (
                        <div className="relative w-full h-48 sm:w-32 sm:h-auto shrink-0 bg-secondary/20">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-1">{item.name}</CardTitle>
                              <Badge variant="outline" className="text-xs mb-2">
                                {item.categoryName}
                              </Badge>
                              <CardDescription className="text-sm line-clamp-2">{item.description}</CardDescription>
                            </div>
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
                      </div>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent >

          {/* Categories Tab */}
          < TabsContent value="categories" className="space-y-4" >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <h2 className="text-2xl font-bold">{t('categories')}</h2>
                <nav className="flex items-center text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t('lists')}</span>
                  <span className="mx-2 text-muted-foreground/50">/</span>
                  <span className={(categories.length || 0) >= (currentRestaurant?.maxCategories || 0) && (currentRestaurant?.maxCategories !== 0) ? 'text-red-500 font-bold' : 'text-emerald-600 font-medium'}>
                    {categories.length || 0} / {(!currentRestaurant?.maxCategories || currentRestaurant?.maxCategories === 0) ? 'Unlimited' : currentRestaurant?.maxCategories} {t('used')}
                  </span>
                </nav>
              </div>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingCategory(null)
                    setCategoryForm({})
                  }}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={(!!currentRestaurant?.maxCategories && currentRestaurant?.maxCategories > 0) && (categories.length >= currentRestaurant?.maxCategories)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addCategory')}
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
          </TabsContent >

          {/* Orders Tab */}
          < TabsContent value="orders" className="space-y-4" >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('incomingOrders')}</h2>
            </div>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row items-base md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">{t('ordersManagement')}</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-[200px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('searchPlaceholder')}
                      className="pl-8"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={orderFilterStatus} onValueChange={setOrderFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t('allStatus')}</SelectItem>
                      <SelectItem value="PENDING">{t('statusPending')}</SelectItem>
                      <SelectItem value="CONFIRMED">{t('statusConfirmed')}</SelectItem>
                      <SelectItem value="PREPARING">{t('statusPreparing')}</SelectItem>
                      <SelectItem value="READY">{t('statusReady')}</SelectItem>
                      <SelectItem value="COMPLETED">{t('statusCompleted')}</SelectItem>
                      <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>
                      <SelectItem value="REJECTED">{t('statusRejected')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 border rounded-md px-2 bg-white w-full sm:w-auto" title="Filter Date">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <input
                      type="date"
                      className="text-sm outline-none w-[110px] py-2"
                      value={orderDateRange.start}
                      onChange={(e) => setOrderDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="date"
                      className="text-sm outline-none w-[110px] py-2"
                      value={orderDateRange.end}
                      onChange={(e) => setOrderDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => fetchDashboardData()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

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

              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="divide-y">

                      {
                        orders.filter(o => {
                          // Status Filter
                          const matchStatus = orderFilterStatus === 'ALL' || o.status === orderFilterStatus;

                          // Date Filter (Strict Range)
                          const orderDate = new Date(o.createdAt);
                          const start = new Date(orderDateRange.start);
                          start.setHours(0, 0, 0, 0);
                          const end = new Date(orderDateRange.end);
                          end.setHours(23, 59, 59, 999);

                          const matchDate = orderDate >= start && orderDate <= end;

                          // Search Filter (Fixing mangled code)
                          const q = orderSearchQuery.toLowerCase();
                          const matchSearch = !q ||
                            o.orderNumber?.toLowerCase().includes(q) ||
                            o.customerName?.toLowerCase().includes(q);

                          return matchStatus && matchDate && matchSearch;
                        })
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((order) => (
                            <div key={order.id} className="p-4 hover:bg-gray-50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-colors">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg">#{order.orderNumber}</span>
                                  <Badge variant={getOrderStatusBadge(order.status).variant as any}>{getOrderStatusBadge(order.status).label}</Badge>
                                  <span className="text-xs text-gray-500 ml-2">{new Date(order.createdAt).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-700">
                                  <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {order.customerName}</div>
                                  <div className="flex items-center gap-1"><Utensils className="h-3 w-3" /> {order.tableNumber || 'Takeaway'}</div>
                                  <div className="flex items-center gap-1 font-medium">{getPaymentMethodIcon(order.paymentMethod)} {order.paymentMethod}</div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {order.items.map(i => `${i.quantity}x ${i.menuItemName}`).join(', ')}
                                </div>
                                {order.notes && <div className="text-xs text-orange-600 italic bg-orange-50 inline-block px-2 py-1 rounded">Note: {order.notes}</div>}
                              </div>
                              <div className="flex flex-col items-end gap-2 w-full sm:w-auto min-w-[140px]">
                                <div className="font-bold text-lg text-emerald-600">Rp {order.totalAmount.toLocaleString('id-ID')}</div>

                                {/* Action Buttons Based on Status */}
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                                  {order.status === 'PENDING' && (
                                    <>
                                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 h-8 w-full sm:w-auto" onClick={() => handleRejectOrder(order.id)}>Reject</Button>
                                      <Button size="sm" className="bg-green-600 h-8 w-full sm:w-auto" onClick={() => setValidateOrderId(order.id)}>Accept</Button>
                                    </>
                                  )}
                                  {order.status === 'CONFIRMED' && (
                                    <Button size="sm" className="w-full sm:w-auto h-8" onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}>Start Cooking</Button>
                                  )}
                                  {order.status === 'PREPARING' && (
                                    <Button size="sm" className="w-full sm:w-auto bg-blue-600 h-8" onClick={() => handleUpdateOrderStatus(order.id, 'READY')}>Mark Ready</Button>
                                  )}
                                  {order.status === 'READY' && (
                                    <Button size="sm" className="w-full sm:w-auto bg-green-600 h-8" onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}>Complete</Button>
                                  )}

                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button size="sm" variant="ghost" className="h-8 flex-1 sm:flex-none sm:w-8 p-0 border sm:border-0" onClick={() => handlePrintOrder(order)}>
                                      <Printer className="h-4 w-4 text-gray-500 mx-auto" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 flex-1 sm:flex-none sm:w-8 p-0 border sm:border-0" onClick={() => setViewOrder(order)}>
                                      <ArrowUpRight className="h-4 w-4 text-blue-500 mx-auto" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                      }

                      {
                        orders.length === 0 && (
                          <div className="p-12 text-center text-gray-400">No orders found</div>
                        )
                      }
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent >




          {/* Analytics Tab */}
          < TabsContent value="analytics" className="space-y-4" >
            <h2 className="text-2xl font-bold">{t('analyticsReport')}</h2>
            {/* Filter Controls */}
            <div className="flex items-center gap-4 mb-4">
              <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => fetchDashboardData()}>
                <RefreshCw className="h-4 w-4 mr-2" /> {t('refresh')}
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">Rp {reportStats?.totalRevenue?.toLocaleString('id-ID') || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportStats?.totalOrders || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('menuItems')}</CardTitle>
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportStats?.totalMenuItems || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('cancelled')}</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{reportStats?.cancelledOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">Lost Revenue: Rp {reportStats?.cancelledRevenue?.toLocaleString('id-ID') || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Revenue Analytics (Daily)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <div className="flex items-end justify-between h-full w-full gap-2 pt-4 px-2 overflow-x-auto">
                    {reportDailyData && Object.keys(reportDailyData).length > 0 ? (
                      Object.entries(reportDailyData).map(([date, data]: any) => (
                        <div key={date} className="flex flex-col items-center gap-1 group relative min-w-[20px] flex-1">
                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded z-10 whitespace-nowrap">
                            {date}: Rp {data.revenue.toLocaleString()} ({data.count} Orders, {data.itemsSold || 0} Items)
                          </div>
                          <div
                            className="w-full bg-emerald-500 rounded-t hover:bg-emerald-600 transition-all"
                            style={{ height: `${Math.max(4, (data.revenue / (Math.max(...Object.values(reportDailyData).map((d: any) => d.revenue), 1) || 1)) * 200)}px` }}
                          ></div>
                          <span className="text-[10px] text-gray-500 -rotate-45 origin-left translate-y-4 truncate w-full block">{date.slice(8)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No data for this period</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Menu Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topMenuItems.length > 0 ? topMenuItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">{item.count} sold</Badge>
                        </div>
                        <span className="text-emerald-600 font-bold">Rp {item.revenue.toLocaleString('id-ID')}</span>
                      </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">No data available</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPaymentMethods.length > 0 ? topPaymentMethods.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                          <span className="font-medium">{item.method}</span>
                          <Badge variant="outline" className="text-xs">{item.count} orders</Badge>
                        </div>
                      </div>
                    )) : <p className="text-sm text-gray-500 text-center py-4">No data available</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent >

          {/* Payment Methods Tab */}
          < TabsContent value="payments" className="space-y-4" >
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
                        <div className="">{getPaymentMethodIcon(method.type)}</div>
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
          </TabsContent >

          {/* History Tab */}


          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('restaurantSettings')}</h2>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={async () => {
                  if (!confirm(t('deleteConfirm'))) return
                  try {
                    const res = await fetch(`/api/restaurants/${restaurantId}`, { method: 'DELETE' })
                    const data = await res.json()
                    if (data.success) {
                      toast({ title: 'Deleted', description: 'Restaurant deleted' })
                      window.location.href = '/dashboard'
                    } else {
                      throw new Error(data.error)
                    }
                  } catch (e: any) {
                    toast({ title: 'Error', variant: 'destructive', description: e.message })
                  }
                }}>
                  <Trash2 className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">{t('delete')}</span>
                </Button>
                {/* Create Branch Button - Only if allowed */}
                {currentRestaurant?.allowBranches && (
                  <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setBranchForm({})}>
                        <Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">{t('createBranch')}</span>
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

                        <div className="border-t pt-4 mt-2 space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="createAdmin"
                              checked={branchForm.createAdmin}
                              onCheckedChange={(checked) => setBranchForm({ ...branchForm, createAdmin: checked })}
                            />
                            <Label htmlFor="createAdmin">Create Branch Admin?</Label>
                          </div>

                          {branchForm.createAdmin && (
                            <div className="pl-6 space-y-4 border-l-2 border-emerald-100">
                              <div className="space-y-1">
                                <Label>Admin Name</Label>
                                <Input
                                  placeholder="John Doe"
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
                )}
              </div>
            </div>

            {myBranches.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{t('myBranches')}</CardTitle>
                  <CardDescription>{t('switchBranches')}</CardDescription>
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

            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t('generalInfo')}</CardTitle>
                <CardDescription>{t('generalInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('restaurantName')}</Label>
                    <Input
                      placeholder="My Restaurant"
                      value={settingsForm.name || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    />
                    <p className="text-xs text-gray-400">{t('restaurantNameDesc')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('storeUrl')}</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="my-resto"
                        value={settingsForm.slug || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, slug: e.target.value })}
                        disabled={true} // Disabled as requested
                        className="bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                      {/* Preview Button works with ID now if slug is disabled/ignored, but we keep slug in URL for now or ID? User asked for rollback to random URL (ID). */}
                      <Button variant="outline" size="icon" asChild title="Preview Store">
                        <a href={`/menu/${currentRestaurant?.id}`} target="_blank" rel="noopener noreferrer">
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('storeUrlDesc')} - Permanent URL: <span className="font-mono text-emerald-600">.../menu/{currentRestaurant?.id}</span>
                    </p>
                  </div>

                  {/* Printer Settings */}
                  <div className="space-y-2 col-span-1 md:col-span-2 border-t pt-4">
                    <h3 className="font-medium mb-2">Printer Settings (Bluetooth Thermal)</h3>
                    <div className="flex items-center justify-between bg-white p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Printer className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-medium">Thermal Printer</div>
                          <div className="text-xs text-gray-500">{isPrinterConnected ? "Connected" : "Disconnected"}</div>
                        </div>
                      </div>
                      <Button
                        variant={isPrinterConnected ? "outline" : "default"}
                        className={isPrinterConnected ? "text-green-600 border-green-200 bg-green-50" : ""}
                        onClick={handleConnectPrinter}
                      >
                        {isPrinterConnected ? <CheckCircle className="h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                        {isPrinterConnected ? "Connected" : "Connect"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('address')}</Label>
                    <Input
                      value={settingsForm.address || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('phone')}</Label>
                    <Input
                      value={settingsForm.phone || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    />
                  </div>
                  {/* Map Settings */}
                  <div className="space-y-2 col-span-1 md:col-span-2 border-t pt-4">
                    <h3 className="font-medium mb-2">{t('locationMaps')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('googleMapsUrl')}</Label>
                        <Input
                          placeholder="https://maps.google.com/..."
                          value={settingsForm.googleMapsUrl || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, googleMapsUrl: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-4 pt-8">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="setting-allowMaps"
                            checked={settingsForm.allowMaps || false}
                            onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, allowMaps: checked })}
                          />
                          <Label htmlFor="setting-allowMaps">{t('showMap')}</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('latitude')}</Label>
                        <Input
                          type="number" step="any"
                          value={settingsForm.latitude || 0}
                          onChange={(e) => setSettingsForm({ ...settingsForm, latitude: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('longitude')}</Label>
                        <Input
                          type="number" step="any"
                          value={settingsForm.longitude || 0}
                          onChange={(e) => setSettingsForm({ ...settingsForm, longitude: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Printer Settings */}
                <div className="border rounded-lg p-4 space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      {t('printerSettings')}
                    </h3>
                    <Badge variant={currentRestaurant?.printerSettings?.paperSize ? "secondary" : "outline"} className={currentRestaurant?.printerSettings?.paperSize ? "bg-green-100 text-green-700" : ""}>
                      {currentRestaurant?.printerSettings?.paperSize ? t('connected') : t('disconnected')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('paperSize')}</Label>
                      <Select
                        value={currentRestaurant?.printerSettings?.paperSize || '58mm'}
                        onValueChange={(val) => {
                          const newSettings = { ...(currentRestaurant?.printerSettings || {}), paperSize: val };
                          fetch(`/api/restaurants/${restaurantId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ printerSettings: newSettings })
                          }).then(() => { toast({ title: "Saved", description: "Printer size updated" }); loadRestaurantDetails(); });
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="58mm">58mm (Standard)</SelectItem>
                          <SelectItem value="80mm">80mm (Wide)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => handlePrintOrder({
                        ...orders[0],
                        items: orders[0]?.items || [],
                        totalAmount: 0,
                        orderNumber: 'TEST-PRINT'
                      } as any)}>
                        {t('testPrint')}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toast({ title: t('printerStatus'), description: t('printerReady') })}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Logo and Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      {currentRestaurant?.logo ? (
                        <div className="relative h-16 w-16 rounded-full overflow-hidden border">
                          <Image src={currentRestaurant.logo} alt="Logo" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed">
                          <Utensils className="h-6 w-6" />
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, async (base64) => {
                          try {
                            const res = await fetch(`/api/restaurants/${restaurantId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ logo: base64 })
                            });
                            if (res.ok) {
                              toast({ title: "Updated", description: "Logo updated successfully" });
                              fetchDashboardData();
                            }
                          } catch (err) { toast({ title: "Error", description: "Failed to upload logo", variant: "destructive" }); }
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Banner Image</Label>
                    <div className="space-y-2">
                      {currentRestaurant?.banner && (
                        <div className="relative h-24 w-full rounded overflow-hidden border">
                          <Image src={currentRestaurant.banner} alt="Banner" fill className="object-cover" />
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, async (base64) => {
                          try {
                            const res = await fetch(`/api/restaurants/${restaurantId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ banner: base64 })
                            });
                            if (res.ok) {
                              toast({ title: "Updated", description: "Banner updated successfully" });
                              fetchDashboardData();
                            }
                          } catch (err) { toast({ title: "Error", description: "Failed to upload banner", variant: "destructive" }); }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 mt-4"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/restaurants/${restaurantId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(settingsForm)
                      });

                      const data = await res.json();

                      if (res.ok) {
                        toast({ title: t('save'), description: "Settings saved successfully" });

                        try {
                          // Force refresh to ensure Slug is propagated
                          await fetchDashboardData();

                          if (data.data && data.data.slug !== currentRestaurant?.slug) {
                            toast({ title: t('save'), description: "URL updated. Please refresh if links look old." });
                            // Optional: window.location.reload()
                          }
                        } catch (refreshErr) {
                          console.error("Refresh failed", refreshErr)
                        }
                      } else {
                        throw new Error(data.error || 'Failed to save settings')
                      }
                    } catch (err: any) {
                      console.error(err)
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    }
                  }}
                >
                  {t('save')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Sales Reports</h2>
              <div className="flex items-center gap-2">
                <div className="flex flex-col sm:flex-row items-base sm:items-center gap-2">
                  <Select value={reportFilterType} onValueChange={(v: any) => setReportFilterType(v)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="ALL">All Status</SelectItem>
                    </SelectContent>
                  </Select>

                  {reportFilterType === 'monthly' ? (
                    <>
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
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        className="border rounded px-2 py-2 text-sm"
                        value={reportDateRange.start}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="date"
                        className="border rounded px-2 py-2 text-sm"
                        value={reportDateRange.end}
                        onChange={(e) => setReportDateRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => fetchDashboardData()}>Refresh</Button>
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={handleDownloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('export')}
                </Button>
              </div>
            </div>

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalOrders')}</CardTitle>
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
                  <CardTitle className="text-sm font-medium">{t('grossRevenue')}</CardTitle>
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
                  <CardTitle className="text-sm font-medium">{t('avgOrderValue')}</CardTitle>
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
                    {Object.entries(reportDailyData || {}).map(([date, data]: [string, any]) => (
                      <div key={date} className="grid grid-cols-4 p-3 text-sm border-b last:border-0 hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {date}
                        </div>
                        <div>{data.count}</div>
                        <div>{data.itemsSold || 0}</div>
                        <div className="text-right font-medium">Rp {data.revenue.toLocaleString('id-ID')}</div>
                      </div>
                    ))}
                    {Object.keys(reportDailyData || {}).length === 0 && (
                      <div className="p-8 text-center text-gray-500">No sales data for this period</div>
                    )}


                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs >
      </main >

      {/* Mobile Bottom Nav */}
      < div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex justify-around py-2 safe-area-pb" >
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
          className={`flex flex-col items-center justify-center p-2 rounded-lg relative ${activeTab === 'orders' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500'}`}
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {pendingOrdersCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white shadow-sm border border-white animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-[10px] font-medium mt-1">Analytics</span>
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
      < footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm w-full py-6 mt-12 mb-20 md:mb-0" >
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2026 Meenuin. Digital Restaurant Platform
          </p>
        </div>
      </footer >

      {/* Helpdesk Floating Button - Visible on all devices */}
      < div className="fixed bottom-20 right-4 z-40 md:bottom-8 md:right-8 flex flex-col items-end gap-2 group" >
        <div className="bg-black/75 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Chat Helpdesk
        </div>
        <Button
          className="rounded-full shadow-lg bg-[#25D366] hover:bg-[#128C7E] text-white p-0 w-14 h-14 flex items-center justify-center transition-transform hover:scale-110"
          onClick={() => window.open(`https://wa.me/${helpdeskSettings?.whatsapp || '6281234567890'}`, '_blank')}
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </div >

      {/* QR Code Dialog for Restaurant Menu */}
      <QRCodeDialog
        open={qrCodeDialogOpen}
        onOpenChange={setQrCodeDialogOpen}
        restaurantSlug={currentRestaurant?.id || ''}
        restaurantName={currentRestaurant?.name || 'Restaurant'}
      />

      {/* ... View Order Dialog ... */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details #{viewOrder?.orderNumber}</DialogTitle>
            <DialogDescription>{new Date(viewOrder?.createdAt || '').toLocaleString()}</DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 p-1">
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between"><span>Customer:</span><span className="font-medium">{viewOrder.customerName}</span></div>
                  <div className="flex justify-between"><span>Table:</span><span className="font-medium">{viewOrder.tableNumber || 'Takeaway'}</span></div>
                  <div className="flex justify-between"><span>Status:</span><Badge variant="outline">{viewOrder.status}</Badge></div>
                  <div className="flex justify-between"><span>Payment:</span><span>{viewOrder.paymentMethod} ({viewOrder.paymentStatus})</span></div>
                  {viewOrder.notes && <div className="mt-2 text-xs italic">Note: {viewOrder.notes}</div>}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm border-b pb-1">Items</h4>
                  {viewOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div className="flex gap-2">
                        <span className="font-bold">{item.quantity}x</span>
                        <div>
                          <div>{item.menuItemName}</div>
                          {item.notes && <div className="text-xs text-gray-400">{item.notes}</div>}
                        </div>
                      </div>
                      <div>{item.price.toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t pt-3 font-bold">
                  <span>Total Amount</span>
                  <span className="text-lg text-emerald-600">Rp {viewOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOrder(null)}>Close</Button>
            <Button onClick={() => viewOrder && handlePrintOrder(viewOrder)}>Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}

