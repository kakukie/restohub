'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore, Restaurant, SubscriptionPlan } from '@/store/app-store'
import { BarChart3, Users, Utensils, DollarSign, LogOut, Plus, Edit, Trash2, Search, ArrowUpRight, ArrowDownRight, Shield, Save, CheckCircle, Smartphone, Megaphone, Building2, Store, TrendingUp, ShoppingBag, Zap, MoreHorizontal } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'

interface Stats {
  totalRestaurants: number
  totalMenuItems: number
  totalOrders: number
  totalRevenue: number
  activeRestaurants: number
  inactiveRestaurants: number
}

export default function SuperAdminDashboard() {
  const {
    user,
    logout,
    restaurants: allRestaurants,
    updateRestaurantStatus,
    updateRestaurant,
    addRestaurant,
    users,
    addUser,
    updateUser,
    deleteUser,
    resetSystem,
    subscriptionPlans,
    updateSubscriptionPlan,
    orders,
    helpdeskSettings,
    updateHelpdeskSettings,
    broadcastAnnouncement,
    setSubscriptionPlans
  } = useAppStore()

  // Fetch Settings on Mount
  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.success && data.data) {
        updateHelpdeskSettings(data.data)
      }
    }).catch(err => console.error(err))
  }, [updateHelpdeskSettings])

  // Use store restaurants 
  const restaurants = allRestaurants

  const { setRestaurants, setUsers } = useAppStore()

  // Fetch data on mount
  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch Restaurants
      const resResto = await fetch('/api/restaurants')
      const dataResto = await resResto.json()
      if (dataResto.success) {
        setRestaurants(dataResto.data)
      }

      // Fetch Users (Admins)
      const resUsers = await fetch('/api/users')
      const dataUsers = await resUsers.json()
      if (dataUsers.success) {
        setUsers(dataUsers.data)
      }

      // Fetch Admin Analytics
      try {
        const resAnalytics = await fetch('/api/admin/analytics')
        const dataAnalytics = await resAnalytics.json()
        if (dataAnalytics.success) {
          setAdminAnalytics(dataAnalytics.data)
        }
      } catch (err) { console.error("Failed to fetch analytics", err) }

      // Fetch Subscription Plans
      try {
        const resPlans = await fetch('/api/subscription-plans')
        const dataPlans = await resPlans.json()
        if (dataPlans.success) {
          setSubscriptionPlans(dataPlans.data)
        }
      } catch (err) { console.error("Failed to fetch plans", err) }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }, [setRestaurants, setUsers, setSubscriptionPlans])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // State definitions
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [planForm, setPlanForm] = useState<{
    name?: string
    description?: string
    price?: number
    menuLimit?: number
    features?: string // text area input
    maxCategories?: number
    allowMaps?: boolean
    enableAnalytics?: boolean
  }>({})
  const [stats, setStats] = useState<Stats>({
    totalRestaurants: 0,
    totalMenuItems: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeRestaurants: 0,
    inactiveRestaurants: 0
  })

  // Admin Analytics State
  const [adminAnalytics, setAdminAnalytics] = useState<{
    topRevenue: any[]
    topSelling: any[]
  }>({ topRevenue: [], topSelling: [] })

  // Helper for image upload
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
  const [searchQuery, setSearchQuery] = useState('')
  const [restaurantDialogOpen, setRestaurantDialogOpen] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)
  const [restaurantForm, setRestaurantForm] = useState<Partial<Restaurant>>({})
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Restaurant | null>(null)
  const [newSubscriptionType, setNewSubscriptionType] = useState<'BASIC' | 'PRO' | 'ENTERPRISE'>('BASIC')
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false)
  const [qrCodeRestaurant, setQrCodeRestaurant] = useState<Restaurant | null>(null)

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'restaurants' | 'plans' | 'users' | 'settings'>('dashboard')

  // User Edit State
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUserData, setEditingUserData] = useState<{ id: string; name: string; email: string; role: string; password: string } | null>(null)

  // Password Reset State
  const [passwordResetOpen, setPasswordResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { resetPassword } = useAppStore()

  const [broadcastMsg, setBroadcastMsg] = useState('')

  // Recalculate stats
  useEffect(() => {
    setStats({
      totalRestaurants: restaurants.length,
      totalMenuItems: 0, // Mock stats for now since we don't have this in Store yet
      totalOrders: 0,
      totalRevenue: 0,
      activeRestaurants: restaurants.filter(r => r.status === 'ACTIVE').length,
      inactiveRestaurants: restaurants.filter(r => r.status !== 'ACTIVE').length
    })
  }, [restaurants])

  // Calculate Top Restaurants by Revenue
  const topRestaurants = restaurants
    .map(r => {
      const restoOrders = orders.filter(o => o.restaurantId === r.id)
      const revenue = restoOrders.reduce((acc, o) => acc + o.totalAmount, 0)
      return { ...r, revenue, orderCount: restoOrders.length }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Calculate Top Menu Items Globally
  const topMenuItems = (() => {
    const itemMap: Record<string, { name: string, count: number, revenue: number }> = {}
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!itemMap[item.menuItemId]) {
          itemMap[item.menuItemId] = { name: item.menuItemName, count: 0, revenue: 0 }
        }
        itemMap[item.menuItemId].count += item.quantity
        itemMap[item.menuItemId].revenue += item.quantity * item.price
      })
    })
    return Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5)
  })()

  const handleEditRestaurantProfile = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant)
    setRestaurantForm({
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      package: restaurant.package as any,
      adminEmail: restaurant.adminEmail,
      logo: restaurant.logo,
      maxMenuItems: restaurant.maxMenuItems,
      maxAdmins: restaurant.maxAdmins,
      maxStaff: restaurant.maxStaff,
      allowBranches: restaurant.allowBranches,
      maxCategories: restaurant.maxCategories,
      allowMaps: restaurant.allowMaps,
      enableAnalytics: restaurant.enableAnalytics,
      maxSlugChanges: restaurant.maxSlugChanges
    })
    setRestaurantDialogOpen(true)
  }

  const handleEditRestaurantAdmin = (restaurant: Restaurant) => {
    if (!users || users.length === 0) {
      toast({ title: 'Loading...', description: 'Please wait for user data to load.' })
      return
    }
    const adminEmail = (restaurant.adminEmail || '').trim()
    const adminUser = users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase())

    if (adminUser) {
      setEditingUserData({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        password: adminUser.password // Password usually hidden/hashed, but for edit we keep existing or blank
      })
      setUserDialogOpen(true)
    } else {
      toast({
        title: 'Admin Not Found',
        description: `No user found with email ${adminEmail}. You may need to create it.`,
        variant: 'destructive',
        action: <Button variant="outline" size="sm" onClick={() => {
          setEditingUserData({
            id: 'new',
            name: 'New Admin',
            email: adminEmail,
            role: 'RESTAURANT_ADMIN',
            password: ''
          })
          setUserDialogOpen(true)
        }}>Create</Button>
      })
    }
  }

  const handleSaveRestaurant = async () => {
    if (!restaurantForm.name) {
      toast({
        title: 'Validation Error',
        description: 'Restaurant name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      if (editingRestaurant) {
        // Update
        const res = await fetch('/api/restaurants', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...restaurantForm,
            id: editingRestaurant.id,
            maxMenuItems: restaurantForm.maxMenuItems,
            maxAdmins: restaurantForm.maxAdmins,
            maxStaff: restaurantForm.maxStaff,
            allowBranches: restaurantForm.allowBranches,
            maxCategories: restaurantForm.maxCategories,
            allowMaps: restaurantForm.allowMaps,
            enableAnalytics: restaurantForm.enableAnalytics
          })
        })
        const data = await res.json()
        if (data.success) {
          // Update local store to reflect changes immediately (optional, or refetch)
          updateRestaurant(editingRestaurant.id, data.data || restaurantForm)
          toast({ title: 'Success', description: 'Restaurant updated successfully' })
        } else {
          throw new Error(data.error)
        }
      } else {
        // Create
        const res = await fetch('/api/restaurants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: restaurantForm.name,
            description: restaurantForm.description,
            address: restaurantForm.address,
            phone: restaurantForm.phone,
            package: restaurantForm.package || 'BASIC',
            email: restaurantForm.adminEmail,
            maxMenuItems: restaurantForm.maxMenuItems,
            maxAdmins: restaurantForm.maxAdmins,
            maxStaff: restaurantForm.maxStaff,
            allowBranches: restaurantForm.allowBranches,
            maxCategories: restaurantForm.maxCategories,
            allowMaps: restaurantForm.allowMaps,
            enableAnalytics: restaurantForm.enableAnalytics,
            logo: restaurantForm.logo
          })
        })
        const data = await res.json()
        if (data.success) {
          addRestaurant(data.data)
          toast({ title: 'Success', description: 'Restaurant created successfully' })
        } else {
          throw new Error(data.error)
        }
      }
      setRestaurantDialogOpen(false)
      setEditingRestaurant(null)
      setRestaurantForm({})
    } catch (error: any) {
      toast({ title: 'Error', variant: 'destructive', description: error.message || 'Operation failed' })
    }
  }

  const handleDeleteRestaurant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/restaurants/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: 'Restaurant deleted' })
        // Fix: setRestaurants expects array, not function updater
        const updated = restaurants.filter(r => r.id !== id)
        setRestaurants(updated)
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ title: 'Error', variant: 'destructive', description: e.message })
    }
  }

  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationChannel, setNotificationChannel] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL')
  const [selectedRestoForAction, setSelectedRestoForAction] = useState<{ id: string, status: 'ACTIVE' | 'REJECTED', name: string } | null>(null)

  const handleToggleRestaurantStatus = (id: string, isActive: boolean, restaurantName: string) => {
    // Open notification dialog first
    setSelectedRestoForAction({ id, status: isActive ? 'ACTIVE' : 'REJECTED', name: restaurantName })
    setNotificationMessage(isActive
      ? `Selamat! Restoran ${restaurantName} telah disetujui. Silakan login untuk melengkapi profil Anda.`
      : `Mohon maaf, registrasi restoran ${restaurantName} belum dapat kami setujui saat ini.`)
    setNotificationChannel('EMAIL') // Default
    setNotificationDialogOpen(true)
  }

  const confirmStatusUpdate = async () => {
    if (!selectedRestoForAction) return

    try {
      const res = await fetch('/api/restaurants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRestoForAction.id,
          status: selectedRestoForAction.status
        })
      })
      const data = await res.json()

      if (data.success) {
        updateRestaurantStatus(selectedRestoForAction.id, selectedRestoForAction.status) // Update local store too

        // Call Real Notification API
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: notificationChannel,
              recipient: selectedRestoForAction.id, // Using Restaurant ID for now, ideally Email. But ID is what we have in selectedRestoForAction context.
              // Ideally we should have passed email here. But let's assume backend resolved email or just log ID. 
              // Actually, let's look up the restaurant to get email or just say "Restaurant Owner".
              message: notificationMessage
            })
          })
        } catch (e) { console.error('Notify failed', e) }

        toast({
          title: 'Status Updated',
          description: `Restaurant ${selectedRestoForAction.status}. Notification sent via ${notificationChannel}.`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setNotificationDialogOpen(false)
      setSelectedRestoForAction(null)
    }
  }

  const handleOpenSubscriptionDialog = (restaurant: Restaurant) => {
    setEditingSubscription(restaurant)
    setNewSubscriptionType(restaurant.package as any || 'BASIC')
    setSubscriptionDialogOpen(true)
  }

  const handleUpdateSubscription = async () => {
    if (!editingSubscription) return

    try {
      // Find plan details with robust matching
      const plan = subscriptionPlans.find(p =>
        p.name === newSubscriptionType ||
        p.id === newSubscriptionType ||
        p.name.toUpperCase() === newSubscriptionType.toUpperCase() ||
        (newSubscriptionType.includes('Free') && p.name.includes('Free')) // Fallback for Free Trial
      )
      const updates: any = { package: newSubscriptionType }

      if (plan) {
        updates.maxCategories = plan.maxCategories
        updates.maxMenuItems = plan.menuLimit
        updates.allowMaps = plan.allowMaps
        updates.enableAnalytics = plan.enableAnalytics
      }

      const res = await fetch(`/api/restaurants/${editingSubscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingSubscription.id, ...updates })
      })
      const data = await res.json()

      if (data.success) {
        updateRestaurant(editingSubscription.id, updates)
        toast({ title: 'Success', description: 'Subscription updated' })
        setSubscriptionDialogOpen(false)
        setEditingSubscription(null)
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      menuLimit: plan.menuLimit,
      features: plan.features.join('\n') // Convert array to multiline string for editing
    })
    setPlanDialogOpen(true)
  }
  const handleSavePlan = async () => {
    if (editingPlan && planForm) {
      let updates: any = {
        name: planForm.name || editingPlan.name,
        description: planForm.description || editingPlan.description,
        price: Number(planForm.price) || editingPlan.price,
        menuLimit: Number(planForm.menuLimit) || editingPlan.menuLimit,
        features: planForm.features ? planForm.features.split('\n').filter(f => f.trim() !== '') : editingPlan.features
      }

      updates = {
        ...updates,
        maxCategories: Number(planForm.maxCategories) || editingPlan.maxCategories,
        allowMaps: planForm.allowMaps ?? editingPlan.allowMaps,
        enableAnalytics: planForm.enableAnalytics ?? editingPlan.enableAnalytics
      }

      try {
        const res = await fetch('/api/subscription-plans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPlan.id, ...updates })
        })
        const data = await res.json()

        if (data.success) {
          updateSubscriptionPlan(editingPlan.id, updates)
          toast({ title: 'Success', description: `Plan "${updates.name}" saved to database` })
          setPlanDialogOpen(false)
          setEditingPlan(null)
          setPlanForm({})
        } else {
          throw new Error(data.error || 'Failed to save')
        }
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    }
  }
  const getPlanById = (id: string) => subscriptionPlans.find(p => p.id === id)

  const handleShowQRCode = (restaurant: Restaurant) => {
    setQrCodeRestaurant(restaurant)
    setQrCodeDialogOpen(true)
  }

  const handlePasswordReset = async () => { // Async
    if (!resetEmail) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' })
      return
    }

    // Find user ID by email
    const targetUser = users.find(u => u.email.toLowerCase() === resetEmail.toLowerCase())
    if (!targetUser) {
      toast({ title: 'Error', description: 'User not found in local records', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetUser.id,
          password: newPassword
        })
      })
      const data = await res.json()
      if (data.success) {
        // Update local store?
        // Ideally we should re-fetch users or update local user
        resetPassword(resetEmail, newPassword) // Keep local store in sync
        toast({ title: 'Success', description: 'Password reset successfully (DB & Local)' })
        setPasswordResetOpen(false)
        setResetEmail('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  const getSubscriptionBadge = (pkg: string) => {
    const plan = subscriptionPlans.find(p => p.id === pkg)
    const variant = pkg === 'ENTERPRISE' ? 'default' : pkg === 'PRO' ? 'secondary' : 'outline'
    return {
      label: plan ? plan.name : pkg,
      variant: variant as 'default' | 'secondary' | 'outline'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-emerald-500/20">Active</span>
      case 'PENDING': return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-amber-500/20">Pending</span>
      case 'REJECTED': return <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-red-500/20">Rejected</span>
      default: return <span className="px-3 py-1 bg-slate-500/10 text-slate-400 text-[10px] font-bold rounded-full uppercase border border-slate-500/20">Unknown</span>
    }
  }

  const [statusFilter, setStatusFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')

  const filteredRestaurants = restaurants.filter((rest: Restaurant) => {
    const matchesSearch = rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rest.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rest.address?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || rest.status === statusFilter
    const matchesPlan = planFilter === 'ALL' || rest.package === planFilter

    return matchesSearch && matchesStatus && matchesPlan
  })

  const pendingRestaurants = restaurants.filter(r => r.status === 'PENDING')

  // --- MODULAR RENDER FUNCTIONS ---

  const renderDashboard = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Executive Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="glass rounded-xl text-sm font-medium border border-slate-700 transition-all font-sans text-white">
            <span className="material-symbols-outlined text-sm mr-2">calendar_today</span>
            Last 30 Days
          </Button>
          <Button className="bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-[#10B981]/20 transition-all" onClick={() => { setRestaurantForm({}); setEditingRestaurant(null); setRestaurantDialogOpen(true); }}>
            <span className="material-symbols-outlined text-sm mr-2">add</span>
            New Restaurant
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#10B981]/10 rounded-full blur-3xl group-hover:bg-[#10B981]/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <span className="text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-400/10 rounded-lg flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> +12.5%
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold mt-1 tracking-tight">Rp {(stats.totalRevenue).toLocaleString('id-ID')}</p>
        </div>

        {/* Active Restaurants */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <span className="text-blue-400 text-xs font-bold px-2 py-1 bg-blue-400/10 rounded-lg flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">store</span> {restaurants.length} Total
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Active Restaurants</h3>
          <p className="text-3xl font-bold mt-1 tracking-tight">{stats.activeRestaurants}</p>
        </div>

        {/* Daily Orders mock mapping */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
              <span className="material-symbols-outlined">shopping_bag</span>
            </div>
            <span className="text-purple-400 text-xs font-bold px-2 py-1 bg-purple-400/10 rounded-lg">Active Now</span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Total Platform Orders</h3>
          <p className="text-3xl font-bold mt-1 tracking-tight">{orders.length}</p>
        </div>

        {/* Pending Approvals */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <span className="material-symbols-outlined">hourglass_empty</span>
            </div>
            <button onClick={() => setActiveTab('restaurants')} className="text-amber-400 text-xs font-bold px-2 py-1 bg-amber-400/10 rounded-lg hover:bg-amber-400/20 transition-colors">
              Review
            </button>
          </div>
          <h3 className="text-slate-400 text-sm font-medium">Pending Approvals</h3>
          <p className="text-3xl font-bold mt-1 tracking-tight">{pendingRestaurants.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-symbols-outlined text-8xl">settings_input_component</span>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-amber-400">campaign</span>
            <h3 className="text-lg font-bold">System Announcements</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-amber-500">engineering</span>
                <div>
                  <p className="font-bold text-sm text-amber-200 uppercase tracking-wide">Maintenance Mode</p>
                  <p className="text-xs text-amber-500/80">Restricts user logins during system updates</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={helpdeskSettings.maintenanceMode} onChange={() => {
                  updateHelpdeskSettings({ maintenanceMode: !helpdeskSettings.maintenanceMode })
                  // Typically we'd also sync to API here
                }} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500">
                </div>
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Broadcast Message</label>
              <div className="flex gap-3">
                <input
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 text-white"
                  placeholder="Type a message to all users..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                />
                <button onClick={() => {
                  broadcastAnnouncement(broadcastMsg)
                  toast({ title: "Broadcast Sent", description: broadcastMsg })
                  setBroadcastMsg('')
                }} className="bg-[#10B981] hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#10B981]/10">Send</button>
              </div>
            </div>
          </div>
        </div>
        {/* Top Performers */}
        <div className="glass p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Top Performers</h3>
            <span className="material-symbols-outlined text-slate-500">trending_up</span>
          </div>
          <div className="space-y-6">
            {adminAnalytics.topRevenue.map((resto, i) => (
              <div key={resto.id} className="flex items-center gap-4 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-xs shadow-lg ${i === 0 ? 'bg-gradient-to-tr from-amber-400 to-amber-600 shadow-amber-500/20' : i === 1 ? 'bg-slate-500 shadow-slate-500/20' : i === 2 ? 'bg-orange-700 shadow-orange-700/20' : 'bg-slate-800'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate group-hover:text-[#10B981] transition-colors">{resto.name}</p>
                  <p className="text-xs text-slate-500 italic">{resto.totalOrders} orders via Platform</p>
                </div>
                <p className="font-black text-[#10B981] text-xs">Rp {(resto.totalRevenue || 0).toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderRestaurants = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Restaurant Management</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage and monitor all restaurant merchants across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setRestaurantForm({}); setEditingRestaurant(null); setRestaurantDialogOpen(true); }} className="bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-[#10B981]/20 transition-all">
            <span className="material-symbols-outlined text-sm mr-2">add</span>
            New Merchant
          </Button>
        </div>
      </header>

      <div className="glass rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase px-1">Search Restaurant</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 text-white placeholder:text-slate-600 transition-all font-sans"
              placeholder="Name, ID, or owner name..." type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase px-1">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase px-1">Plan</label>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Plans</SelectItem>
              {subscriptionPlans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="glass rounded-3xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider font-bold bg-white/5 border-b border-white/5">
                <th className="px-6 py-4">Merchant</th>
                <th className="px-6 py-4">Owner Info</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRestaurants.map(restaurant => {
                const planInfo = getSubscriptionBadge(restaurant.package as any)
                return (
                  <tr key={restaurant.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-white/5 overflow-hidden shadow-inner ${restaurant.status !== 'ACTIVE' ? 'grayscale opacity-60' : ''}`}>
                          {restaurant.logo ? (
                            <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-2xl text-slate-600">store</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white group-hover:text-[#10B981] transition-colors">{restaurant.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {restaurant.address || 'No Location'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-200 cursor-pointer hover:underline" onClick={() => handleEditRestaurantAdmin(restaurant)}>{restaurant.adminEmail || 'No Admin Assigned'}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[12px]">mail</span>
                        {restaurant.slug}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer" title="Toggle Active Status">
                          <input type="checkbox" className="sr-only peer" checked={restaurant.status === 'ACTIVE'} onChange={(e) => handleToggleRestaurantStatus(restaurant.id, e.target.checked, restaurant.name)} />
                          <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                        {getStatusBadge(restaurant.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleOpenSubscriptionDialog(restaurant)} className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-extrabold rounded-lg uppercase border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                        {planInfo.label}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditRestaurantProfile(restaurant)} className="p-2 glass rounded-lg text-slate-400 hover:text-white hover:border-[#10B981]/50 transition-all group/btn bg-white/5" title="Edit Profile">
                          <span className="material-symbols-outlined text-lg">edit_square</span>
                        </button>
                        <button onClick={() => handleShowQRCode(restaurant)} className="p-2 glass rounded-lg text-slate-400 hover:text-white hover:border-[#10B981]/50 transition-all bg-white/5" title="View QR">
                          <span className="material-symbols-outlined text-lg">qr_code_2</span>
                        </button>
                        <button onClick={() => handleDeleteRestaurant(restaurant.id)} className="p-2 glass rounded-lg text-red-400/70 hover:text-red-400 hover:border-red-400/50 transition-all bg-white/5" title="Delete">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredRestaurants.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">No restaurants found.</div>
        )}
      </section>
    </div>
  )

  const renderPlans = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Plans and Pricing</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage subscription tiers and global feature availability.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => {
            setPlanForm({ features: 'Unlimited Menu\nAnalytics\nQR Code\nSupport' })
            setEditingPlan(null)
            setPlanDialogOpen(true)
          }} className="bg-[#10B981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#10B981]/20 flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-sm">add</span>
            Add New Plan
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subscriptionPlans.map((plan, i) => (
          <div key={plan.id} className={`glass p-8 rounded-[32px] flex flex-col relative group transition-all duration-300 hover:-translate-y-1 ${plan.name.toUpperCase() === 'PRO' ? 'border border-[#10B981]/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''}`}>
            {plan.name.toUpperCase() === 'PRO' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#10B981] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-[#10B981]/20">Most Popular</div>
            )}
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.name.toUpperCase() === 'PRO' ? 'bg-[#10B981]/20 text-[#10B981]' : i === 0 ? 'bg-white/5 text-slate-300' : 'bg-white/5 text-purple-400'}`}>
                <span className="material-symbols-outlined">{plan.name.toUpperCase() === 'PRO' ? 'auto_awesome' : i === 0 ? 'rocket_launch' : 'corporate_fare'}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed min-h-[40px]">{plan.description || 'Access to premium features.'}</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-3xl font-extrabold text-white">Rp {(plan.price || 0).toLocaleString('id-ID')}</span>
              <span className="text-slate-500 text-sm">/month</span>
            </div>
            <div className="space-y-4 mb-8 flex-1">
              {plan.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#10B981] text-lg mt-0.5">check_circle</span>
                  <span className="text-sm text-slate-300">{feat}</span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-white/10">
              <Button onClick={() => handleEditPlan(plan)} className={`w-full py-6 text-sm font-bold transition-all rounded-xl ${plan.name.toUpperCase() === 'PRO' ? 'bg-[#10B981] text-white hover:bg-emerald-600 shadow-lg shadow-[#10B981]/20' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                Edit Plan
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">User Control &amp; Permissions</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage internal team roles, admins, and security logs.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map((systemUser) => (
          <div key={systemUser.id} className="glass p-6 rounded-3xl relative group border border-white/5">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {/* Mock avatar styling */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ring-2 ${systemUser.role === 'SUPER_ADMIN' ? 'bg-primary ring-primary/20' : 'bg-slate-700 ring-slate-500/20'}`}>
                    {systemUser.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white">{systemUser.name}</h4>
                  <p className="text-xs text-slate-500">{systemUser.email}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase border ${systemUser.role === 'SUPER_ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                {systemUser.role.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => {
                setEditingUserData(systemUser)
                setUserDialogOpen(true)
              }} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5">
                Edit Profile
              </button>
              <button onClick={() => {
                setResetEmail(systemUser.email)
                setPasswordResetOpen(true)
              }} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/5 text-white" title="Reset Password">
                <span className="material-symbols-outlined text-sm">key</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Global System Settings</h2>
          <p className="text-slate-500 dark:text-slate-400">Configure global SaaS parameters and protocols.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-[#10B981] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#10B981]/20 flex items-center gap-2 transition-all" onClick={() => toast({ title: "Settings Saved" })}>
            <span className="material-symbols-outlined text-sm">save</span>
            Save All Changes
          </button>
        </div>
      </header>

      <div className="max-w-5xl space-y-6">
        <section className="glass rounded-3xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
              <span className="material-symbols-outlined">settings_suggest</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">General Configuration</h3>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Site branding and basic controls</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400">Platform Name</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 text-slate-100" type="text" defaultValue="RestoHub SaaS" disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400">Support Email</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 text-slate-100"
                  type="email"
                  value={helpdeskSettings?.email || ''}
                  onChange={async (e) => {
                    const val = e.target.value
                    updateHelpdeskSettings({ ...helpdeskSettings, email: val })
                    try {
                      await fetch('/api/settings', {
                        method: 'PUT',
                        body: JSON.stringify({ email: val })
                      })
                    } catch (err) { console.error(err) }
                  }}
                  placeholder="support@meenuin.biz.id"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div>
                  <p className="font-bold text-sm text-white">Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Restricts user logins for updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={helpdeskSettings.maintenanceMode} onChange={async () => {
                    const newMode = !helpdeskSettings.maintenanceMode
                    updateHelpdeskSettings({ ...helpdeskSettings, maintenanceMode: newMode })
                    try {
                      await fetch('/api/settings', {
                        method: 'PUT',
                        body: JSON.stringify({ maintenanceMode: newMode })
                      })
                    } catch (err) { console.error(err) }
                  }} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="glass rounded-3xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <span className="material-symbols-outlined">hub</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Third-Party Integrations</h3>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Payment Gateways & Messaging</p>
            </div>
          </div>
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-sm">chat</span>
                </div>
                <span className="font-bold text-sm text-white">WhatsApp Gateway (Fonnte)</span>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">API Token</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter your Fonnte Whatsapp number"
                    type="text"
                    value={helpdeskSettings?.whatsapp || ''}
                    onChange={async (e) => {
                      const val = e.target.value
                      updateHelpdeskSettings({ ...helpdeskSettings, whatsapp: val })
                      try {
                        await fetch('/api/settings', {
                          method: 'PUT',
                          body: JSON.stringify({ whatsapp: val })
                        })
                      } catch (err) { console.error(err) }
                    }}
                  />
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-[#10B981] transition-all">Test</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <span className="material-symbols-outlined">dangerous</span>
            </div>
            <div>
              <h4 className="font-bold text-red-200">Danger Zone</h4>
              <p className="text-xs text-red-500/70 italic">Highly sensitive destructive operations</p>
            </div>
          </div>
          <button onClick={() => toast({ title: "Reset Called", description: "System reset simulated" })} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/20">
            Factory Reset Cache
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex text-slate-900 dark:text-slate-100 font-sans dark:bg-[#0B0F1A] bg-[#F9FAFB]  selection:bg-[#10B981]/30">

      {/* SIDEBAR HTML Structure */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-white/5 z-50 flex-col hidden lg:flex bg-[#0B0F1A]/80 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="material-symbols-outlined text-white">shield_person</span>
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-white">Meenuin<span className="text-[#10B981]">.</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Super Admin</p>
            </div>
          </div>
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'dashboard' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'dashboard' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>dashboard</span>
              <span>Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('restaurants')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'restaurants' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'restaurants' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>restaurant</span>
              <span>Restaurants</span>
            </button>
            <button onClick={() => setActiveTab('plans')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'plans' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'plans' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>payments</span>
              <span>Plans & Pricing</span>
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'users' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'users' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>people_alt</span>
              <span>User Control</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'settings' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'settings' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>settings</span>
              <span>System Settings</span>
            </button>
          </nav>
        </div>
        <div className="mt-auto p-6 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border-2 border-[#10B981]">{user?.name?.charAt(0) || 'A'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-slate-500 truncate">Super Admin</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 border-none bg-transparent">
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-8 min-h-screen">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'restaurants' && renderRestaurants()}
        {activeTab === 'plans' && renderPlans()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'settings' && renderSettings()}

        <Dialog open={passwordResetOpen} onOpenChange={setPasswordResetOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
              <DialogDescription className="dark:text-slate-400">Enter user email and new password</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User Email</Label>
                <Input
                  placeholder="user@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasswordResetOpen(false)}>Cancel</Button>
              <Button onClick={handlePasswordReset}>Reset Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={restaurantDialogOpen} onOpenChange={setRestaurantDialogOpen}>
          <DialogContent className="max-h-[95vh] flex flex-col dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <DialogHeader>
              <DialogTitle>{editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                {editingRestaurant ? 'Update restaurant details' : 'Create a new restaurant profile'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[65vh] pr-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="dark:text-white">Restaurant Name</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={restaurantForm.name || ''}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                    placeholder="e.g. Warung Nusantara"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Description</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={restaurantForm.description || ''}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Slug (Auto-generated)</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 cursor-not-allowed bg-gray-100"
                    value={restaurantForm.slug || ''}
                    disabled={true}
                    placeholder="Auto-generated"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Address</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={restaurantForm.address || ''}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Phone</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={restaurantForm.phone || ''}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                    placeholder="Contact number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="dark:text-white">Max Menu Items (0 = Unlimited)</Label>
                    <Input
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      type="number"
                      value={restaurantForm.maxMenuItems || ''}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, maxMenuItems: parseInt(e.target.value) || 0 })}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-white">Max Admins (0 = Unlimited)</Label>
                    <Input
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      type="number"
                      value={restaurantForm.maxAdmins || ''}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, maxAdmins: parseInt(e.target.value) || 0 })}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-white">Max Staff (0 = Unlimited)</Label>
                    <Input
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      type="number"
                      value={restaurantForm.maxStaff || ''}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, maxStaff: parseInt(e.target.value) || 0 })}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-white">Max Categories (0 = Unlimited)</Label>
                    <Input
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      type="number"
                      value={restaurantForm.maxCategories || ''}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, maxCategories: parseInt(e.target.value) || 0 })}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="allowBranches"
                    className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500 bg-white"
                    checked={restaurantForm.allowBranches || false}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, allowBranches: e.target.checked })}
                  />
                  <Label htmlFor="allowBranches" className="cursor-pointer dark:text-white">Allow Multi-Branch?</Label>
                </div>
                {restaurantForm.allowBranches && (
                  <div className="space-y-2 ml-6">
                    <Label className="dark:text-white">Max Branches (0 = Unlimited)</Label>
                    <Input
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      type="number"
                      value={restaurantForm.maxBranches || 0}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, maxBranches: parseInt(e.target.value) || 0 })}
                      placeholder="Unlimited"
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="allowMaps"
                    className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500 bg-white"
                    checked={restaurantForm.allowMaps || false}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, allowMaps: e.target.checked })}
                  />
                  <Label htmlFor="allowMaps" className="cursor-pointer dark:text-white">Allow Google Maps?</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="enableAnalytics"
                    className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500 bg-white"
                    checked={restaurantForm.enableAnalytics || false}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, enableAnalytics: e.target.checked })}
                  />
                  <Label htmlFor="enableAnalytics" className="cursor-pointer dark:text-white">Enable Advanced Analytics?</Label>
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Max Categories (0 = Unlimited)</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    type="number"
                    value={restaurantForm.maxCategories ?? 10}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, maxCategories: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Max Slug Changes</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    type="number"
                    value={restaurantForm.maxSlugChanges ?? 3}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, maxSlugChanges: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Restaurant Logo</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setRestaurantForm({ ...restaurantForm, logo: base64 }))}
                  />
                  {restaurantForm.logo && (
                    <div className="mt-2 w-20 h-20 border dark:border-slate-700 rounded overflow-hidden relative">
                      <Image src={restaurantForm.logo} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" className="dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white" onClick={() => setRestaurantDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveRestaurant}>{editingRestaurant ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subscription Edit Dialog */}
        <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <DialogHeader>
              <DialogTitle>Edit Subscription Plan</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Change subscription plan for {editingSubscription?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="dark:text-white">Select Plan</Label>
                <Select value={newSubscriptionType} onValueChange={(val) => setNewSubscriptionType(val as any)}>
                  <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    {subscriptionPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id} className="dark:focus:bg-slate-700">
                        {plan.name} - Rp {plan.price.toLocaleString('id-ID')}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400">
                Current Plan: <span className="font-semibold text-slate-900 dark:text-white">{editingSubscription?.package}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white" onClick={() => setSubscriptionDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateSubscription}>Update Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Plan Edit Dialog */}
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <DialogHeader>
              <DialogTitle>Edit Plan: {editingPlan?.name}</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Modify subscription plan details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="dark:text-white">Plan Name</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={planForm.name || ''}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">Price (Rp)</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  type="number"
                  value={planForm.price || ''}
                  onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">Menu Limit</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  type="number"
                  value={planForm.menuLimit || ''}
                  onChange={(e) => setPlanForm({ ...planForm, menuLimit: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">Description</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={planForm.description || ''}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">Category Limit</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  type="number"
                  value={planForm.maxCategories || ''}
                  onChange={(e) => setPlanForm({ ...planForm, maxCategories: Number(e.target.value) })}
                  placeholder="0 for Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">Features (One per line)</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input dark:border-slate-700 dark:bg-slate-800 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white"
                  value={typeof planForm.features === 'string' ? planForm.features : ''}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="50 Menu Items&#10;Basic Analytics&#10;Email Support"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePlan}>Save Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Edit Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Update user details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="dark:text-white">Name</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={editingUserData?.name || ''}
                  onChange={(e) => setEditingUserData(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">Email</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={editingUserData?.email || ''}
                  onChange={(e) => setEditingUserData(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">Role</Label>
                <Select
                  value={editingUserData?.role || ''}
                  onValueChange={(val) => setEditingUserData(prev => prev ? { ...prev, role: val } : null)}
                >
                  <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                    <SelectItem value="SUPER_ADMIN" className="dark:focus:bg-slate-700">Super Admin</SelectItem>
                    <SelectItem value="RESTAURANT_ADMIN" className="dark:focus:bg-slate-700">Restaurant Admin</SelectItem>
                    <SelectItem value="CUSTOMER" className="dark:focus:bg-slate-700">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">New Password (leave blank to keep current)</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  type="password"
                  placeholder="Enter new password"
                  value={editingUserData?.password || ''}
                  onChange={(e) => setEditingUserData(prev => prev ? { ...prev, password: e.target.value } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (editingUserData) {
                  try {
                    const res = await fetch('/api/users', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: editingUserData.id,
                        name: editingUserData.name,
                        email: editingUserData.email,
                        role: editingUserData.role,
                        password: editingUserData.password || undefined
                      })
                    })
                    const data = await res.json()

                    if (data.success) {
                      updateUser(editingUserData.id, {
                        name: editingUserData.name,
                        email: editingUserData.email,
                        role: editingUserData.role as any,
                        password: editingUserData.password || undefined
                      })
                      toast({ title: 'Success', description: 'User updated successfully' })
                      setUserDialogOpen(false)
                      setEditingUserData(null)
                    } else {
                      throw new Error(data.error)
                    }
                  } catch (err: any) {
                    toast({ title: 'Error', description: 'Failed to update user: ' + err.message, variant: 'destructive' })
                  }
                }
              }}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notification Dialog */}
        <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <DialogHeader>
              <DialogTitle>Update Status & Notify</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Send a notification to <b>{selectedRestoForAction?.name}</b> regarding this status change ({selectedRestoForAction?.status}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="dark:text-white">Notification Channel</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="channel"
                      checked={notificationChannel === 'EMAIL'}
                      onChange={() => setNotificationChannel('EMAIL')}
                      className="w-4 h-4 text-emerald-600 dark:bg-slate-800 dark:border-slate-700"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="channel"
                      checked={notificationChannel === 'WHATSAPP'}
                      onChange={() => setNotificationChannel('WHATSAPP')}
                      className="w-4 h-4 text-emerald-600 dark:bg-slate-800 dark:border-slate-700"
                    />
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">Message</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input dark:border-slate-700 dark:bg-slate-800 bg-background px-3 py-2 text-sm text-slate-900 dark:text-white"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white" onClick={() => setNotificationDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmStatusUpdate}>Send & Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <Dialog open={passwordResetOpen} onOpenChange={setPasswordResetOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
              <DialogDescription className="dark:text-slate-400">Enter user email and new password</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="dark:text-white">User Email</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  placeholder="user@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">New Password</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-white">Confirm Password</Label>
                <Input
                  className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white" onClick={() => setPasswordResetOpen(false)}>Cancel</Button>
              <Button onClick={handlePasswordReset}>Reset Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      {/* Mobile Bottom Navigation Bar (Visible only on lg:hidden) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-2xl lg:hidden flex gap-8 items-center border border-white/10 shadow-2xl z-[100] bg-[#0B0F1A]/90 backdrop-blur-xl">
        <button onClick={() => setActiveTab('dashboard')} className={`${activeTab === 'dashboard' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">dashboard</span></button>
        <button onClick={() => setActiveTab('restaurants')} className={`${activeTab === 'restaurants' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">restaurant</span></button>
        <button onClick={() => setActiveTab('plans')} className={`${activeTab === 'plans' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">payments</span></button>
        <button onClick={() => setActiveTab('users')} className={`${activeTab === 'users' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">people_alt</span></button>
        <button onClick={() => setActiveTab('settings')} className={`${activeTab === 'settings' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">settings</span></button>
      </div>
    </div >
  )
}
