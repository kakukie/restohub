'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback, useRef } from 'react'
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
import { BarChart3, Users, Utensils, DollarSign, LogOut, Plus, Edit, Trash2, Search, ArrowUpRight, ArrowDownRight, Shield, Save, CheckCircle, Smartphone, Megaphone, Building2, Store, TrendingUp, ShoppingBag, Zap, MoreHorizontal, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'
import { compressImage } from '@/lib/image-utils'
import { Loader2 } from 'lucide-react'
import LandingEditorTab from './LandingEditorTab'
import HelpdeskChat from './HelpdeskChat'
import { useTranslation } from '@/lib/i18n'

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
    setSubscriptionPlans,
    setRestaurants,
    setUsers,
    language
  } = useAppStore()

  const t = useTranslation(language || 'en')
  
  const { theme, setTheme } = useTheme()

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

  // Fetch data on mount
  const fetchDashboardData = useCallback(async () => {
    try {
      const authReq = fetch('/api/auth/me'); // Fire auth early in background
      const [
        resResto,
        resUsers,
        resAnalytics,
        resPlans,
        resLogs
      ] = await Promise.all([
        fetch('/api/restaurants'),
        fetch('/api/users'),
        fetch('/api/admin/analytics'),
        fetch('/api/subscription-plans'),
        fetch('/api/admin/audit-logs?limit=20')
      ]);

      const [dataResto, dataUsers, dataAnalytics, dataPlans, dataLogs, dataSubscriptions] = await Promise.all([
        resResto.json(),
        resUsers.json(),
        resAnalytics.ok ? resAnalytics.json() : Promise.resolve({ success: false }),
        resPlans.ok ? resPlans.json() : Promise.resolve({ success: false }),
        resLogs.ok ? resLogs.json() : Promise.resolve({ success: false }),
        fetch('/api/admin/subscriptions').then(r => r.ok ? r.json() : { success: false })
      ]);

      if (dataResto.success) setRestaurants(dataResto.data)
      if (dataUsers.success) setUsers(dataUsers.data)
      if (dataAnalytics.success) setAdminAnalytics(dataAnalytics.data)
      if (dataPlans.success) setSubscriptionPlans(dataPlans.data)
      if (dataLogs.success) setAuditLogs(dataLogs.data)
      if (dataSubscriptions && dataSubscriptions.success) setSubscriptionsData(dataSubscriptions.data)

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
    price3Months?: number
    price6Months?: number
    price12Months?: number
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
    globalStats?: {
      totalRevenue: number
      totalOrders: number
      activeRestaurants: number
      pendingApproval: number
    }
  }>({ topRevenue: [], topSelling: [] })

  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Subscriptions Tab State
  const [subscriptionsData, setSubscriptionsData] = useState<any[]>([])
  const [selectedSubscriptionForReview, setSelectedSubscriptionForReview] = useState<any>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [activeUntilInput, setActiveUntilInput] = useState<string>('')
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const [importTargetRestaurant, setImportTargetRestaurant] = useState<{ id: string, name?: string } | null>(null)

  // Helper for image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploadingLogo(true)
      try {
        const compressedBlob = await compressImage(file, 800, 800, 0.7)
        const formData = new FormData()
        formData.append('file', compressedBlob, 'logo.jpg')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()
        if (data.success) {
          callback(data.url)
        } else {
          toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' })
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' })
      } finally {
        setIsUploadingLogo(false)
      }
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const toInputDateTime = (date?: string | Date | null) => {
    if (!date) return ''
    const d = new Date(date)
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
    return iso.slice(0, 16)
  }

  useEffect(() => {
    if (selectedSubscriptionForReview?.restaurant?.activeUntil) {
      setActiveUntilInput(toInputDateTime(selectedSubscriptionForReview.restaurant.activeUntil))
    } else {
      setActiveUntilInput('')
    }
  }, [selectedSubscriptionForReview])

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'restaurants' | 'plans' | 'users' | 'settings' | 'landing-editor' | 'helpdesk' | 'audit-logs' | 'subscriptions'>('dashboard')

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
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

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

  // Use optimized backend analytics for accurate global revenue instead of local empty orders array
  const topRestaurants = adminAnalytics.topRevenue || []

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
      enabledFeatures: restaurant.enabledFeatures || [],
      maxSlugChanges: restaurant.maxSlugChanges,
      activeUntil: restaurant.activeUntil ? toInputDateTime(restaurant.activeUntil) : ''
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
        const res = await fetch(`/api/restaurants/${editingRestaurant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...restaurantForm
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
            enabledFeatures: restaurantForm.enabledFeatures || [],
            activeUntil: restaurantForm.activeUntil,
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
    if (!window.confirm('Are you sure you want to completely delete this restaurant? This cannot be undone.')) return

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
  const [selectedRestoForAction, setSelectedRestoForAction] = useState<{ id: string, status: 'ACTIVE' | 'REJECTED', name: string, email: string } | null>(null)

  const handleToggleRestaurantStatus = (id: string, isActive: boolean, restaurantName: string, adminEmail: string) => {
    // Open notification dialog first
    setSelectedRestoForAction({ id, status: isActive ? 'ACTIVE' : 'REJECTED', name: restaurantName, email: adminEmail })
    setNotificationMessage(isActive
      ? `Selamat! Restoran ${restaurantName} telah disetujui. Silakan kunjungi halaman login untuk masuk menggunakan email terdaftar Anda dan password yang telah Anda buat.`
      : `Mohon maaf, registrasi restoran ${restaurantName} belum dapat kami setujui saat ini. Silakan balas email ini atau hubungi tim support kami untuk informasi lebih lanjut.`)
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
          // Use targeted email types for better templates
          const notificationType = selectedRestoForAction.status === 'ACTIVE'
            ? 'APPROVE_RESTAURANT'
            : 'REJECT_RESTAURANT';

          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: notificationType,
              recipient: selectedRestoForAction.email || 'support@meenuin.biz.id',
              message: notificationMessage,
              restaurantName: selectedRestoForAction.name
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

  const handleToggleMerchantActive = async (id: string, currentIsActive: boolean) => {
    try {
      const res = await fetch(`/api/restaurants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentIsActive })
      })
      const data = await res.json()
      if (data.success) {
        updateRestaurant(id, { isActive: !currentIsActive })
        toast({ title: 'Success', description: `Merchant ${!currentIsActive ? 'Enabled' : 'Suspended'}` })
      } else {
        throw new Error(data.error)
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const handleOpenSubscriptionDialog = (restaurant: Restaurant) => {
    setEditingSubscription(restaurant)
    setNewSubscriptionType(restaurant.package as any)
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
      price3Months: plan.price3Months,
      price6Months: plan.price6Months,
      price12Months: plan.price12Months,
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
        price3Months: planForm.price3Months !== undefined ? Number(planForm.price3Months) : editingPlan.price3Months,
        price6Months: planForm.price6Months !== undefined ? Number(planForm.price6Months) : editingPlan.price6Months,
        price12Months: planForm.price12Months !== undefined ? Number(planForm.price12Months) : editingPlan.price12Months,
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

  const handleReviewSubscription = async (id: string, status: 'PAID' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Success', description: `Subscription marked as ${status}` })
        setReviewDialogOpen(false)
        setSelectedSubscriptionForReview(null)
        // Refresh data
        fetchDashboardData()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', variant: 'destructive', description: error.message })
    }
  }

  const handleUpdateActivePeriod = async () => {
    try {
      if (!selectedSubscriptionForReview?.restaurant?.id || !activeUntilInput) {
        toast({ title: 'Error', description: 'Pilih tanggal aktif dan restoran', variant: 'destructive' })
        return
      }
      const res = await fetch('/api/admin/restaurants/active-period', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: selectedSubscriptionForReview.restaurant.id,
          activeUntil: activeUntilInput
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Berhasil', description: 'Masa aktif restoran diperbarui' })
        fetchDashboardData()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleExportMenu = async (restaurantId?: string, name?: string) => {
    if (!restaurantId) {
      toast({ title: 'Error', description: 'RestaurantId tidak ditemukan', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch(`/api/admin/export-menu?restaurantId=${restaurantId}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `menu-${name || restaurantId}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleImportMenu = (restaurantId?: string, name?: string) => {
    if (!restaurantId) {
      toast({ title: 'Error', description: 'RestaurantId tidak ditemukan', variant: 'destructive' })
      return
    }
    setImportTargetRestaurant({ id: restaurantId, name })
    importFileInputRef.current?.click()
  }

  const onImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !importTargetRestaurant) return
    try {
      const text = await file.text()
      const res = await fetch('/api/admin/import-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: importTargetRestaurant.id,
          csv: text
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Berhasil', description: `Import ${data.data.count} menu untuk ${importTargetRestaurant.name || ''}` })
        fetchDashboardData()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      e.target.value = ''
      setImportTargetRestaurant(null)
    }
  }

  const renderSubscriptionsTab = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 mt-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#F8FAFC]">Subscription Verifications</h2>
          <p className="text-slate-400">Review and approve uploaded payment proofs from merchants.</p>
        </div>
      </header>

      <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-3xl relative overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold border-b border-[#2A344A]">
                <th className="pb-3 px-2 font-semibold">DATE</th>
                <th className="pb-3 px-2 font-semibold">MERCHANT</th>
                <th className="pb-3 px-2 font-semibold">PLAN REQUESTED</th>
                <th className="pb-3 px-2 font-semibold">AMOUNT PAID</th>
                <th className="pb-3 px-2 font-semibold">STATUS</th>
                <th className="pb-3 px-2 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A344A]/50">
              {subscriptionsData.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-2 text-sm text-slate-400">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-2">
                    <p className="font-bold text-sm text-[#F8FAFC]">{sub.restaurant?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{sub.restaurant?.email || '-'}</p>
                  </td>
                  <td className="py-4 px-2">
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-black rounded border border-purple-500/20 uppercase">
                      {sub.planName}
                    </span>
                  </td>
                  <td className="py-4 px-2 font-bold text-[#F8FAFC]">
                    Rp {sub.amount?.toLocaleString('id-ID')}
                  </td>
                  <td className="py-4 px-2">
                    {sub.status === 'PAID' ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">PAID</span>
                    ) : sub.status === 'REJECTED' ? (
                      <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20">REJECTED</span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full border border-amber-500/20">PENDING</span>
                    )}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className={`text-xs h-8 ${sub.restaurant?.isActive ? 'text-red-400 hover:text-red-500 border-red-400/20' : 'text-emerald-400 hover:text-emerald-500 border-emerald-400/20'}`}
                        onClick={() => handleToggleMerchantActive(sub.restaurant?.id, sub.restaurant?.isActive)}
                      >
                        {sub.restaurant?.isActive ? 'Suspend' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        className="text-xs h-8 dark:border-slate-700"
                        onClick={() => handleExportMenu(sub.restaurant?.id, sub.restaurant?.name)}
                      >
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        className="text-xs h-8 dark:border-slate-700"
                        onClick={() => handleImportMenu(sub.restaurant?.id, sub.restaurant?.name)}
                      >
                        Import
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedSubscriptionForReview(sub)
                          setActiveUntilInput(toInputDateTime(sub.restaurant?.activeUntil))
                          setReviewDialogOpen(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                      >
                        Review
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {subscriptionsData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 text-sm">No subscription records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#F8FAFC]">Executive {t('dashboard')}</h2>
          <p className="text-slate-400">{t('welcome')}. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-[#1A2235] border-[#2A344A] hover:bg-[#2A344A] text-[#F8FAFC] rounded-full text-sm font-medium transition-all">
            <span className="material-symbols-outlined text-sm mr-2">calendar_today</span>
            Last 30 Days
          </Button>
          <Button className="bg-[#10B981] hover:bg-[#059669] text-white rounded-full text-sm font-bold shadow-lg shadow-[#10B981]/20 transition-all px-6" onClick={() => { setRestaurantForm({}); setEditingRestaurant(null); setRestaurantDialogOpen(true); }}>
            <span className="material-symbols-outlined text-sm mr-2">add</span>
            New Restaurant
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <span className="material-symbols-outlined text-xl">analytics</span>
            </div>
            <span className="text-emerald-400 text-xs font-bold px-3 py-1 bg-emerald-400/10 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> Live
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1 mt-auto">Global Revenue</h3>
          <p className="text-2xl font-black text-[#F8FAFC]">Rp {((adminAnalytics.globalStats?.totalRevenue || 0) / 1000000).toFixed(1)}M</p>
        </div>

        {/* Total Orders */}
        <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <span className="material-symbols-outlined text-xl">receipt_long</span>
            </div>
            <span className="text-blue-400 text-xs font-bold px-3 py-1 bg-blue-400/10 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span> Live
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1 mt-auto">Global Orders</h3>
          <p className="text-2xl font-black text-[#F8FAFC]">
            {adminAnalytics.globalStats?.totalOrders || 0}
          </p>
        </div>

        {/* Active Restaurants */}
        <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <span className="material-symbols-outlined text-xl">store</span>
            </div>
            <span className="text-indigo-400 text-xs font-bold px-3 py-1 bg-indigo-400/10 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">storefront</span> System
            </span>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1 mt-auto">Active Restaurants</h3>
          <p className="text-2xl font-black text-[#F8FAFC]">{adminAnalytics.globalStats?.activeRestaurants || 0} <span className="text-sm font-normal text-slate-500">of {stats.totalRestaurants}</span></p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <span className="material-symbols-outlined text-xl">hourglass_empty</span>
            </div>
            <button onClick={() => setActiveTab('restaurants')} className="text-amber-500 text-xs font-bold px-3 py-1 bg-amber-500/10 rounded-full hover:bg-amber-500/20 transition-colors border border-amber-500/30">
              Review
            </button>
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1 mt-auto">Pending Approvals</h3>
          <p className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">{adminAnalytics.globalStats?.pendingApproval || 0}</p>
          <div className="mt-4 flex items-center gap-1.5 text-amber-500 text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">error</span> Needs Attention
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-2xl relative overflow-hidden w-full hidden">
            {/* Kept out for now to manage layout, system announcements usually below */}
          </div>

          <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-3xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Restaurant Management</h3>
                <p className="text-slate-500 text-sm">Detailed overview of all registered merchants</p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                  <input
                    className="w-full bg-[#111827] border border-[#2A344A] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#10B981] text-white placeholder:text-slate-600 transition-all"
                    placeholder="Search merchants..." type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="w-10 h-10 rounded-full bg-[#111827] border border-[#2A344A] flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-xs font-bold border-b border-[#2A344A]">
                    <th className="pb-3 px-2 font-semibold">RESTAURANT NAME</th>
                    <th className="pb-3 px-2 font-semibold">OWNER / CONTACT</th>
                    <th className="pb-3 px-2 font-semibold text-center">STATUS</th>
                    <th className="pb-3 px-2 font-semibold text-center">PLAN</th>
                    <th className="pb-3 px-2 font-semibold text-right">REVENUE</th>
                    <th className="pb-3 px-2 font-semibold text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A344A]/50">
                  {filteredRestaurants.slice(0, 3).map(restaurant => {
                    const planInfo = getSubscriptionBadge(restaurant.package as any)
                    const revenueStats = topRestaurants.find((r) => r.id === restaurant.id)
                    const revenue = revenueStats ? revenueStats.totalRevenue : 0
                    return (
                      <tr key={restaurant.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full bg-[#111827] border border-[#2A344A] flex items-center justify-center font-bold text-slate-300 overflow-hidden shadow-inner ${restaurant.status !== 'ACTIVE' ? 'grayscale opacity-60' : ''}`}>
                              {restaurant.logo ? (
                                <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm">{restaurant.name.substring(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#F8FAFC]">{restaurant.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                {restaurant.address || 'Indonesia'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-sm font-semibold text-[#F8FAFC]">{restaurant.name.split(' ')[0]} Admin</p>
                          <p className="text-xs text-slate-500 mt-0.5">{restaurant.adminEmail || 'admin@domain.com'}</p>
                        </td>
                        <td className="py-4 px-2 text-center">
                          {restaurant.status === 'ACTIVE' ? (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full uppercase border border-emerald-500/20 inline-block">Active</span>
                          ) : restaurant.status === 'PENDING' ? (
                            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full uppercase border border-amber-500/20 inline-block">Pending</span>
                          ) : (
                            <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full uppercase border border-red-500/20 inline-block">Rejected</span>
                          )}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[9px] font-black rounded border border-purple-500/20 uppercase inline-block">
                            {planInfo.label}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <span className="text-sm font-bold text-[#F8FAFC]">Rp {revenue.toLocaleString('id-ID')}</span>
                        </td>

                        <td className="py-4 px-2 text-center">
                          <button className="text-slate-500 hover:text-white transition-colors" title="Options" onClick={() => handleEditRestaurantProfile(restaurant)}>
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>
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

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#2A344A]">
              <span className="text-xs text-slate-500">Showing 1 to {Math.min(filteredRestaurants.length, 3)} of {restaurants.length} restaurants</span>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 text-xs font-semibold text-slate-400 bg-transparent border border-[#2A344A] rounded-full hover:text-white transition-colors">Previous</button>
                <button disabled className="px-4 py-1.5 text-xs font-semibold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-full">Next</button>
              </div>
            </div>
          </div>

          {/* System Announcements Block */}
          <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 p-8 opacity-5">
              <span className="material-symbols-outlined text-[120px]">equalizer</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-amber-500">campaign</span>
              <h3 className="text-lg font-bold text-[#F8FAFC]">System Announcements</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                    <span className="material-symbols-outlined text-[20px]">engineering</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-amber-500 tracking-wide">MAINTENANCE MODE</p>
                    <p className="text-xs text-amber-500/70">Restricts user logins during system updates</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={helpdeskSettings.maintenanceMode} onChange={() => {
                    updateHelpdeskSettings({ ...helpdeskSettings, maintenanceMode: !helpdeskSettings.maintenanceMode })
                  }} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]">
                  </div>
                </label>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">BROADCAST MESSAGE</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      className="w-full bg-[#111827] border border-[#2A344A] rounded-full pl-4 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#10B981] text-white placeholder:text-slate-600 transition-all"
                      placeholder="Type a message to all users..."
                      value={broadcastMsg}
                      onChange={(e) => setBroadcastMsg(e.target.value)}
                    />
                  </div>
                  <button onClick={() => {
                    broadcastAnnouncement(broadcastMsg)
                    toast({ title: "Broadcast Sent", description: broadcastMsg })
                    setBroadcastMsg('')
                  }} className="bg-[#10B981] hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-[#10B981]/20">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Top Performers */}
        <div className="bg-[#1A2235] border border-[#2A344A] p-6 rounded-3xl h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-[#F8FAFC]">Top Performers</h3>
            <span className="material-symbols-outlined text-slate-500">trending_up</span>
          </div>
          <div className="space-y-6 flex-1">
            {adminAnalytics.topRevenue.slice(0, 3).map((resto, i) => (
              <div key={resto.id} className="flex items-center gap-4 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-lg border border-white/10 ${i === 0 ? 'bg-orange-500 shadow-orange-500/20 text-white' : i === 1 ? 'bg-slate-400 shadow-slate-400/20 text-white' : 'bg-red-600 shadow-red-600/20 text-white'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#F8FAFC] truncate">{resto.name}</p>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">{resto.totalOrders} orders today</p>
                </div>
                <p className="font-black text-[#10B981] text-xs">Rp {((resto.totalRevenue || 0) / 1000).toFixed(0)}K</p>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-3 rounded-full bg-[#111827] border border-[#2A344A] text-xs font-semibold text-slate-300 hover:bg-[#2A344A] hover:text-white transition-all text-center flex items-center justify-center gap-2">
            View Full Ranking
          </button>
        </div>
      </div>
    </div>
  )

  const renderRestaurants = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('restaurantSettings')}</h2>
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
                          <input type="checkbox" className="sr-only peer" checked={restaurant.status === 'ACTIVE'} onChange={(e) => handleToggleRestaurantStatus(restaurant.id, e.target.checked, restaurant.name, restaurant.adminEmail)} />
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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 mt-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#F8FAFC]">Plans and Pricing</h2>
          <p className="text-slate-400">Manage subscription tiers and global feature availability.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-[#1A2235] border-[#2A344A] hover:bg-[#2A344A] text-[#F8FAFC] rounded-full text-sm font-medium transition-all px-4 h-10">
            Monthly
          </Button>
          <Button variant="outline" className="bg-[#111827] border-[#2A344A] hover:bg-[#2A344A] text-slate-400 rounded-full text-sm font-medium transition-all px-4 h-10">
            Yearly (20% Off)
          </Button>
          <Button onClick={() => {
            setPlanForm({ features: 'Unlimited Menu\nAnalytics\nQR Code\nSupport' })
            setEditingPlan(null)
            setPlanDialogOpen(true)
          }} className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-[#10B981]/20 flex items-center gap-2 transition-all h-10">
            <span className="material-symbols-outlined text-sm">add</span>
            Add New Plan
          </Button>
        </div>
      </header>

      {/* Merchant Subscription Status */}
      <div className="bg-[#1A2235] border border-[#2A344A] rounded-3xl overflow-hidden mt-8">
        <div className="p-6 border-b border-[#2A344A] flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#F8FAFC]">Merchant Subscription Status</h3>
          <button className="text-xs font-bold text-[#10B981] hover:underline" onClick={() => setActiveTab('restaurants')}>View All Merchants</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-bold border-b border-[#2A344A] bg-[#111827]/50">
                <th className="px-6 py-4">MERCHANT</th>
                <th className="px-6 py-4 text-center">PACKAGE</th>
                <th className="px-6 py-4 text-center">STATUS</th>
                <th className="px-6 py-4">EXPIRES AT</th>
                <th className="px-6 py-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A344A]/50">
              {restaurants.slice(0, 10).map((resto) => (
                <tr key={resto.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#111827] border border-[#2A344A] flex items-center justify-center text-xs font-bold text-slate-400">
                      {resto.logo ? <img src={resto.logo} className="w-full h-full object-cover rounded-lg" /> : resto.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-sm text-[#F8FAFC]">{resto.name}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-full border border-purple-500/20 uppercase">
                      {resto.package}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {resto.isActive ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase">Active</span>
                    ) : (
                      <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full border border-red-500/20 uppercase">Suspended</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {resto.activeUntil ? new Date(resto.activeUntil).toLocaleDateString() : 'No Limit'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditRestaurantProfile(resto)} className="text-[#10B981] hover:bg-[#10B981]/10">
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 mt-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#F8FAFC]">User Control &amp; Permissions</h2>
          <p className="text-slate-400">Manage internal team roles, access levels, and security logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
            <SelectTrigger className="bg-[#1A2235] border-[#2A344A] text-white rounded-full w-[180px]">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="RESTAURANT_ADMIN">Resto Admin</SelectItem>
              <SelectItem value="CUSTOMER">Guest / Customer</SelectItem>
            </SelectContent>
          </Select>
          {selectedUserIds.length > 0 && (
            <Button onClick={async () => {
              if (confirm(`Hapus ${selectedUserIds.length} user terpilih?`)) {
                try {
                  const res = await fetch('/api/users/bulk-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedUserIds })
                  })
                  const data = await res.json()
                  if (data.success) {
                    toast({ title: 'Success', description: `${selectedUserIds.length} users deleted.` })
                    setSelectedUserIds([])
                    fetchDashboardData()
                  } else {
                    throw new Error(data.error)
                  }
                } catch (e: any) {
                  toast({ title: 'Error', description: e.message, variant: 'destructive' })
                }
              }
            }} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-red-500/20 h-10">
              Delete ({selectedUserIds.length})
            </Button>
          )}
          <Button variant="outline" className="bg-[#1A2235] border-[#2A344A] hover:bg-[#2A344A] text-[#F8FAFC] rounded-full text-sm font-medium transition-all px-4 h-10 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">history</span>
            Audit Logs
          </Button>
          <Button className="bg-[#10B981] hover:bg-[#059669] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-[#10B981]/20 flex items-center gap-2 transition-all h-10 border border-[#10B981]">
            <span className="material-symbols-outlined text-sm">person_add</span>
            Invite User
          </Button>
        </div>
      </header>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.filter(u => userRoleFilter === 'ALL' || u.role === userRoleFilter).map((systemUser, i) => {
          // Find if this user is attached to a restaurant
          const userRestaurant = restaurants.find(r => r.adminEmail?.toLowerCase() === systemUser.email.toLowerCase())
          const isSelected = selectedUserIds.includes(systemUser.id)

          return (
            <div key={systemUser.id} className={`bg-[#1A2235] border ${isSelected ? 'border-[#10B981]' : 'border-[#2A344A]'} p-6 rounded-[32px] relative flex flex-col group transition-all duration-300`}>
              <div className="absolute top-6 right-6 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUserIds([...selectedUserIds, systemUser.id])
                    else setSelectedUserIds(selectedUserIds.filter(id => id !== systemUser.id))
                  }}
                  className="w-5 h-5 rounded border-[#2A344A] bg-[#111827] text-[#10B981] focus:ring-[#10B981]"
                />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ring-1 ${systemUser.role === 'SUPER_ADMIN' ? 'bg-[#111827] ring-[#2A344A]' : 'bg-slate-700 ring-slate-500/20'}`}>
                      {systemUser.role === 'SUPER_ADMIN' ? 'SA' : systemUser.name.charAt(0).toUpperCase()}
                    </div>
                    {systemUser.role === 'SUPER_ADMIN' && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10B981] ring-2 ring-[#1A2235]"></div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#F8FAFC]">{systemUser.name}</h4>
                    <p className="text-xs text-slate-500">{systemUser.email}</p>
                  </div>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>

              <div className="flex gap-2 mb-8">
                <span className={`px-3 py-1 font-bold rounded-full uppercase border text-[10px] ${systemUser.role === 'SUPER_ADMIN' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                  {systemUser.role.replace('_', ' ')}
                </span>
                {userRestaurant && (
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase ${userRestaurant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    userRestaurant.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                    {userRestaurant.name} ({userRestaurant.status})
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-8 flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Created At</span>
                  <span className="text-[#F8FAFC]">Today</span>
                </div>
              </div>

              <div className="flex gap-2 w-full pt-4 border-t border-[#2A344A]">
                <button onClick={() => {
                  setEditingUserData(systemUser)
                  setUserDialogOpen(true)
                }} className="flex-1 py-3 bg-[#111827] border border-[#2A344A] hover:bg-[#2A344A] text-slate-300 rounded-full text-xs font-bold transition-all text-center">
                  Edit Profile
                </button>
                <button onClick={() => {
                  setResetEmail(systemUser.email)
                  setPasswordResetOpen(true)
                }} className="px-4 py-3 bg-[#111827] border border-[#2A344A] hover:bg-[#2A344A] rounded-full flex items-center justify-center transition-all text-slate-400" title="Manage Keys/Password">
                  <span className="material-symbols-outlined text-[16px]">key</span>
                </button>
                {systemUser.role !== 'SUPER_ADMIN' && (
                  <button onClick={async () => {
                    if (confirm(`Are you sure you want to delete ${systemUser.name}? This will remove their account permanently (hard delete) or deactivate it if they have orders (soft delete).`)) {
                      try {
                        const res = await fetch(`/api/users?id=${systemUser.id}`, { method: 'DELETE' })
                        const data = await res.json()
                        if (data.success) {
                          deleteUser(systemUser.id)
                          toast({ title: 'User Deleted', description: data.message || `${systemUser.name} has been removed.`, variant: 'default' })
                        } else {
                          toast({ title: 'Deletion Failed', variant: 'destructive', description: data.error || 'Failed to delete user' })
                        }
                      } catch (err) {
                        console.error('Failed to delete user:', err)
                        toast({ title: 'Network Error', variant: 'destructive', description: 'Could not connect to the server to delete user.' })
                      }
                    }
                  }} className="px-4 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-full flex items-center justify-center transition-all text-red-500" title="Delete User">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderAuditLogs = () => (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 mt-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#F8FAFC]">Audit Logs</h2>
          <p className="text-slate-400">Track all system changes, logins, and administrative actions.</p>
        </div>
      </header>

      <div className="bg-[#1A2235] border border-[#2A344A] rounded-[32px] overflow-hidden">
        <div className="p-6 border-b border-[#2A344A] flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-white">System Activity</h3>
            <p className="text-xs text-slate-400">Recent actions performed by users and admins</p>
          </div>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111827] text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Target</th>
                <th className="p-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A344A]">
              {auditLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 text-sm text-white font-medium">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-500">history</span>
                      {log.action}
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-500 mt-1 pl-6">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-bold border border-slate-700">
                        {log.user?.name?.charAt(0) || '?'}
                      </span>
                      {log.user?.name || log.userId || 'System'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                      {log.targetType} {log.targetId ? `#${log.targetId.substring(0, 8)}` : ''}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 text-slate-100"
                  type="text"
                  value={helpdeskSettings?.platformName || ''}
                  onChange={async (e) => {
                    const val = e.target.value
                    updateHelpdeskSettings({ ...helpdeskSettings, platformName: val })
                    try {
                      await fetch('/api/settings', {
                        method: 'PUT',
                        body: JSON.stringify({ platformName: val })
                      })
                    } catch (err) { console.error(err) }
                  }}
                  placeholder="Meenuin SaaS"
                />
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
            <div className="space-y-6 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
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

              {helpdeskSettings.maintenanceMode && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400">Maintenance Title</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 text-slate-100"
                      type="text"
                      value={helpdeskSettings?.maintenanceTitle || ''}
                      onChange={async (e) => {
                        const val = e.target.value
                        updateHelpdeskSettings({ ...helpdeskSettings, maintenanceTitle: val })
                        try {
                          await fetch('/api/settings', {
                            method: 'PUT',
                            body: JSON.stringify({ maintenanceTitle: val })
                          })
                        } catch (err) { console.error(err) }
                      }}
                      placeholder="Sistem Maintenance"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-400">Maintenance Message</label>
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 text-slate-100 min-h-[100px]"
                      value={helpdeskSettings?.maintenanceMessage || ''}
                      onChange={async (e) => {
                        const val = e.target.value
                        updateHelpdeskSettings({ ...helpdeskSettings, maintenanceMessage: val })
                        try {
                          await fetch('/api/settings', {
                            method: 'PUT',
                            body: JSON.stringify({ maintenanceMessage: val })
                          })
                        } catch (err) { console.error(err) }
                      }}
                      placeholder="Kami sedang melakukan pembaruan sistem. Mohon tunggu sebentar."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400">Start Time</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 text-slate-100"
                        type="datetime-local"
                        value={helpdeskSettings?.maintenanceStart || ''}
                        onChange={async (e) => {
                          const val = e.target.value
                          updateHelpdeskSettings({ ...helpdeskSettings, maintenanceStart: val })
                          try {
                            await fetch('/api/settings', {
                              method: 'PUT',
                              body: JSON.stringify({ maintenanceStart: val })
                            })
                          } catch (err) { console.error(err) }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-400">End Time</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 text-slate-100"
                        type="datetime-local"
                        value={helpdeskSettings?.maintenanceEnd || ''}
                        onChange={async (e) => {
                          const val = e.target.value
                          updateHelpdeskSettings({ ...helpdeskSettings, maintenanceEnd: val })
                          try {
                            await fetch('/api/settings', {
                              method: 'PUT',
                              body: JSON.stringify({ maintenanceEnd: val })
                            })
                          } catch (err) { console.error(err) }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
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

        {/* Payment Configuration */}
        <section className="glass rounded-3xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Konfigurasi Pembayaran</h3>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Bank Transfer & QRIS untuk aktivasi langganan</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            {/* Bank Transfer */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-sm">account_balance</span>
                </div>
                <span className="font-bold text-sm text-white">Bank Transfer</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Nama Bank</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="contoh: BCA"
                    type="text"
                    value={helpdeskSettings?.bankName || ''}
                    onChange={async (e) => {
                      const val = e.target.value
                      updateHelpdeskSettings({ ...helpdeskSettings, bankName: val })
                      try {
                        await fetch('/api/settings', { method: 'PUT', body: JSON.stringify({ bankName: val }) })
                      } catch (err) { console.error(err) }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Nomor Rekening</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="contoh: 1234567890"
                    type="text"
                    value={helpdeskSettings?.bankAccountNumber || ''}
                    onChange={async (e) => {
                      const val = e.target.value
                      updateHelpdeskSettings({ ...helpdeskSettings, bankAccountNumber: val })
                      try {
                        await fetch('/api/settings', { method: 'PUT', body: JSON.stringify({ bankAccountNumber: val }) })
                      } catch (err) { console.error(err) }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Atas Nama</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="contoh: PT Meenuin Digital"
                    type="text"
                    value={helpdeskSettings?.bankAccountName || ''}
                    onChange={async (e) => {
                      const val = e.target.value
                      updateHelpdeskSettings({ ...helpdeskSettings, bankAccountName: val })
                      try {
                        await fetch('/api/settings', { method: 'PUT', body: JSON.stringify({ bankAccountName: val }) })
                      } catch (err) { console.error(err) }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-sm">qr_code_2</span>
                </div>
                <span className="font-bold text-sm text-white">QRIS</span>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Upload Gambar QRIS</label>
                <div className="flex flex-col gap-3">
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      const reader = new FileReader()
                      reader.onloadend = async () => {
                        const base64String = reader.result as string
                        updateHelpdeskSettings({ ...helpdeskSettings, qrisImageUrl: base64String })
                        try {
                          await fetch('/api/settings', { method: 'PUT', body: JSON.stringify({ qrisImageUrl: base64String }) })
                          toast({ title: 'QRIS Tersimpan', description: 'Gambar QRIS berhasil diperbarui.' })
                        } catch (err) {
                          console.error(err)
                          toast({ title: 'Error', description: 'Gagal menyimpan QRIS', variant: 'destructive' })
                        }
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                  {helpdeskSettings?.qrisImageUrl && (
                    <div className="mt-2 w-32 h-32 border border-white/10 rounded-xl overflow-hidden relative bg-white">
                      <Image
                        src={helpdeskSettings.qrisImageUrl}
                        alt="QRIS Preview"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">Upload gambar QRIS (maks. 5MB). Gambar akan otomatis disimpan saat dipilih.</p>
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
              <h1 className="font-extrabold text-xl tracking-tight text-white">{helpdeskSettings.platformName || 'Meenuin'}<span className="text-[#10B981]">.</span></h1>
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
            <button onClick={() => setActiveTab('subscriptions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'subscriptions' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'subscriptions' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>fact_check</span>
              <span>Subscriptions</span>
            </button>
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'users' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'users' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>people_alt</span>
              <span>User Control</span>
            </button>
            <button onClick={() => setActiveTab('landing-editor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'landing-editor' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'landing-editor' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>web</span>
              <span>Landing Editor</span>
            </button>
            <button onClick={() => setActiveTab('helpdesk')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'helpdesk' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'helpdesk' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>support_agent</span>
              <span>Helpdesk</span>
            </button>
            <button onClick={() => setActiveTab('audit-logs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${activeTab === 'audit-logs' ? 'bg-[#10B981]/10 text-[#10B981] border-r-4 border-[#10B981] font-semibold' : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'}`}>
              <span className={`material-symbols-outlined text-xl ${activeTab === 'audit-logs' ? '' : 'group-hover:text-[#10B981] transition-colors'}`}>history</span>
              <span>Audit Logs</span>
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
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-slate-500 hover:text-white border-none bg-transparent">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
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
        {activeTab === 'subscriptions' && renderSubscriptionsTab()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'audit-logs' && renderAuditLogs()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'landing-editor' && <LandingEditorTab />}
        {activeTab === 'helpdesk' && <HelpdeskChat role="SUPER_ADMIN" />}

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
                    <Label className="dark:text-white">License / Plan</Label>
                    <Select
                      value={restaurantForm.package || 'FREE_TRIAL'}
                      onValueChange={(val) => setRestaurantForm({ ...restaurantForm, package: val as any })}
                    >
                      <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                        {subscriptionPlans.map(p => (
                          <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-white">Active Until</Label>
                    <Input
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      type="datetime-local"
                      value={(restaurantForm as any).activeUntil || ''}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, activeUntil: e.target.value as any })}
                    />
                  </div>
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

                <div className="pt-4 pb-2 border-t dark:border-slate-800">
                  <h4 className="text-sm font-bold mb-3 dark:text-white uppercase tracking-wider text-primary">Modular Features</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Custom Invoice</p>
                          <p className="text-[10px] text-slate-400">Professional sales invoice & WA</p>
                        </div>
                      </div>
                      <Switch 
                        checked={restaurantForm.enabledFeatures?.includes('CUSTOM_INVOICE') || false}
                        onCheckedChange={(checked) => {
                          const current = restaurantForm.enabledFeatures || [];
                          const updated = checked 
                            ? [...current, 'CUSTOM_INVOICE']
                            : current.filter(f => f !== 'CUSTOM_INVOICE');
                          setRestaurantForm({ ...restaurantForm, enabledFeatures: updated });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Advanced Stock</p>
                          <p className="text-[10px] text-slate-400">Mutasi, Expiry, and Returns</p>
                        </div>
                      </div>
                      <Switch 
                        checked={restaurantForm.enabledFeatures?.includes('ADVANCED_STOCK') || false}
                        onCheckedChange={(checked) => {
                          const current = restaurantForm.enabledFeatures || [];
                          const updated = checked 
                            ? [...current, 'ADVANCED_STOCK']
                            : current.filter(f => f !== 'ADVANCED_STOCK');
                          setRestaurantForm({ ...restaurantForm, enabledFeatures: updated });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Multi-Branch</p>
                          <p className="text-[10px] text-slate-400">Manage multiple restaurant outlets</p>
                        </div>
                      </div>
                      <Switch 
                        checked={restaurantForm.allowBranches || false}
                        onCheckedChange={(checked) => {
                          const current = restaurantForm.enabledFeatures || [];
                          const updated = checked 
                            ? [...current.filter(f => f !== 'MULTI_BRANCH'), 'MULTI_BRANCH']
                            : current.filter(f => f !== 'MULTI_BRANCH');
                          setRestaurantForm({ 
                            ...restaurantForm, 
                            allowBranches: checked, 
                            enabledFeatures: updated 
                          });
                        }}
                      />
                    </div>

                    {restaurantForm.allowBranches && (
                      <div className="bg-slate-800/20 p-3 rounded-xl border border-slate-700/30 ml-4 animate-in slide-in-from-top-2">
                        <Label className="text-xs font-bold dark:text-slate-400 uppercase">Max Branches (0 = Unlimited)</Label>
                        <Input
                          className="mt-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                          type="number"
                          value={restaurantForm.maxBranches || 0}
                          onChange={(e) => setRestaurantForm({ ...restaurantForm, maxBranches: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Advanced Analytics</p>
                          <p className="text-[10px] text-slate-400">Deep reports & sales insights</p>
                        </div>
                      </div>
                      <Switch 
                        checked={restaurantForm.enableAnalytics || false}
                        onCheckedChange={(checked) => {
                          const current = restaurantForm.enabledFeatures || [];
                          const updated = checked 
                            ? [...current.filter(f => f !== 'ADVANCED_ANALYTICS'), 'ADVANCED_ANALYTICS']
                            : current.filter(f => f !== 'ADVANCED_ANALYTICS');
                          setRestaurantForm({ 
                            ...restaurantForm, 
                            enableAnalytics: checked,
                            enabledFeatures: updated 
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-500/20 text-slate-400 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Google Maps</p>
                          <p className="text-[10px] text-slate-400">Show location on QR Menu</p>
                        </div>
                      </div>
                      <Switch 
                        checked={restaurantForm.allowMaps || false}
                        onCheckedChange={(checked) => setRestaurantForm({ ...restaurantForm, allowMaps: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">QR Code Branding</p>
                          <p className="text-[10px] text-slate-400">Allow merchant to upload custom QR logo</p>
                        </div>
                      </div>
                      <Switch 
                        checked={restaurantForm.enabledFeatures?.includes('CUSTOM_QR_LOGO') || false}
                        onCheckedChange={(checked) => {
                          const current = restaurantForm.enabledFeatures || [];
                          const updated = checked 
                            ? [...current, 'CUSTOM_QR_LOGO']
                            : current.filter(f => f !== 'CUSTOM_QR_LOGO');
                          setRestaurantForm({ ...restaurantForm, enabledFeatures: updated });
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Delivery / Biteship</p>
                          <p className="text-[10px] text-slate-400">Allow delivery orders and real-time shipping rates</p>
                        </div>
                      </div>
                      <Switch 
                        checked={restaurantForm.enabledFeatures?.includes('DELIVERY_INTEGRATION') || false}
                        onCheckedChange={(checked) => {
                          const current = restaurantForm.enabledFeatures || [];
                          const updated = checked 
                            ? [...current, 'DELIVERY_INTEGRATION']
                            : current.filter(f => f !== 'DELIVERY_INTEGRATION');
                          setRestaurantForm({ ...restaurantForm, enabledFeatures: updated });
                        }}
                      />
                    </div>
                  </div>
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
                    onChange={(e) => handleImageUpload(e, (url) => setRestaurantForm({ ...restaurantForm, logo: url }))}
                  />
                  {isUploadingLogo && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading...
                    </div>
                  )}
                  {restaurantForm.logo && !isUploadingLogo && (
                    <div className="mt-2 w-20 h-20 border dark:border-slate-700 rounded overflow-hidden relative">
                      <Image src={restaurantForm.logo} alt="Preview" fill className="object-cover" onError={(e) => { const target = e.target as HTMLImageElement; target.src = 'https://placehold.co/100x100/e2e8f0/64748b?text=Preview'; target.srcset = ''; }} />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="dark:text-white">Price 1 Mo (Rp)</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    type="number"
                    value={planForm.price !== undefined ? planForm.price : ''}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Price 3 Mo (Rp)</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    type="number"
                    value={planForm.price3Months !== undefined ? planForm.price3Months : ''}
                    onChange={(e) => setPlanForm({ ...planForm, price3Months: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Price 6 Mo (Rp)</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    type="number"
                    value={planForm.price6Months !== undefined ? planForm.price6Months : ''}
                    onChange={(e) => setPlanForm({ ...planForm, price6Months: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-white">Price 12 Mo (Rp)</Label>
                  <Input
                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    type="number"
                    value={planForm.price12Months !== undefined ? planForm.price12Months : ''}
                    onChange={(e) => setPlanForm({ ...planForm, price12Months: Number(e.target.value) })}
                  />
                </div>
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

        {/* Subscription Verification Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Subscription Upload</DialogTitle>
              <DialogDescription className="dark:text-slate-400">
                Verify the payment proof for {selectedSubscriptionForReview?.restaurant?.name || 'Unknown'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              {selectedSubscriptionForReview && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 font-semibold mb-1">Plan Requested</p>
                    <p className="font-bold">{selectedSubscriptionForReview.planName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold mb-1">Amount</p>
                    <p className="font-bold text-[#10B981]">Rp {selectedSubscriptionForReview.amount?.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold mb-1">Status</p>
                    <p>{selectedSubscriptionForReview.status}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold mb-1">Created At</p>
                    <p>{new Date(selectedSubscriptionForReview.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-500 font-semibold mb-1">Active Until</p>
                      <input
                        type="datetime-local"
                        value={activeUntilInput}
                        onChange={(e) => setActiveUntilInput(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button className="bg-emerald-700 hover:bg-emerald-600 text-white w-full" onClick={handleUpdateActivePeriod}>
                        Save Active Period
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 font-semibold mb-2">Payment Proof (QRIS / Bank Transfer)</p>
                    {selectedSubscriptionForReview.proofImageUrl ? (
                      <div className="border border-slate-700 rounded-xl overflow-hidden relative w-full h-[400px] bg-black/20">
                        <Image
                          src={selectedSubscriptionForReview.proofImageUrl}
                          alt="Payment Proof"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-800/50 rounded-lg text-slate-500 text-center italic">
                        No proof image attached
                      </div>
                    )}
                  </div>
                  {selectedSubscriptionForReview.notes && (
                    <div className="col-span-2">
                      <p className="text-slate-500 font-semibold mb-1">Notes from Merchant</p>
                      <p className="p-3 bg-slate-800/50 rounded-lg whitespace-pre-line">{selectedSubscriptionForReview.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button variant="outline" className="dark:border-slate-700" onClick={() => setReviewDialogOpen(false)}>Close</Button>
              {selectedSubscriptionForReview?.status === 'PENDING' && (
                <>
                  <Button variant="outline" className="text-red-500 hover:text-red-400 dark:border-slate-700" onClick={() => handleReviewSubscription(selectedSubscriptionForReview.id, 'REJECTED')}>Reject</Button>
                  <Button className="bg-[#10B981] text-white hover:bg-emerald-600" onClick={() => handleReviewSubscription(selectedSubscriptionForReview.id, 'PAID')}>Approve Payment</Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <input type="file" accept=".csv,text/csv" className="hidden" ref={importFileInputRef} onChange={onImportFileChange} />

      {/* Mobile Bottom Navigation Bar (Visible only on lg:hidden) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-2xl lg:hidden flex gap-8 items-center border border-white/10 shadow-2xl z-[100] bg-[#0B0F1A]/90 backdrop-blur-xl">
        <button onClick={() => setActiveTab('dashboard')} className={`${activeTab === 'dashboard' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">dashboard</span></button>
        <button onClick={() => setActiveTab('restaurants')} className={`${activeTab === 'restaurants' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">restaurant</span></button>
        <button onClick={() => setActiveTab('plans')} className={`${activeTab === 'plans' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">payments</span></button>
        <button onClick={() => setActiveTab('users')} className={`${activeTab === 'users' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">people_alt</span></button>
        <button onClick={() => setActiveTab('landing-editor')} className={`${activeTab === 'landing-editor' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">web</span></button>
        <button onClick={() => setActiveTab('settings')} className={`${activeTab === 'settings' ? 'text-[#10B981]' : 'text-slate-500 hover:text-white'}`}><span className="material-symbols-outlined">settings</span></button>
      </div>
    </div >
  )
}
