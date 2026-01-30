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
    broadcastAnnouncement
  } = useAppStore()

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

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }, [setRestaurants, setUsers])

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
      logo: restaurant.logo
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
            allowBranches: restaurantForm.allowBranches
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

  const handleDeleteRestaurant = (id: string) => {
    // Mock delete
    toast({ title: 'Notice', description: 'Deletion is disabled in this demo.' })
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
        toast({
          title: 'Status Updated',
          description: `Restaurant ${selectedRestoForAction.status}. Notified via ${notificationChannel} (Simulated).`
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

  const handleUpdateSubscription = () => {
    if (!editingSubscription) return

    updateRestaurant(editingSubscription.id, { package: newSubscriptionType as any })

    setSubscriptionDialogOpen(false)
    setEditingSubscription(null)
    toast({ title: 'Success', description: 'Subscription updated' })
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
      const updates = {
        name: planForm.name || editingPlan.name,
        description: planForm.description || editingPlan.description,
        price: Number(planForm.price) || editingPlan.price,
        menuLimit: Number(planForm.menuLimit) || editingPlan.menuLimit,
        features: planForm.features ? planForm.features.split('\n').filter(f => f.trim() !== '') : editingPlan.features
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
        } else {
          throw new Error(data.error || 'Failed to save')
        }
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      }
    }
    setPlanDialogOpen(false)
    setEditingPlan(null)
    setPlanForm({})
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
      case 'ACTIVE': return <Badge className="bg-green-600">Active</Badge>
      case 'PENDING': return <Badge className="bg-yellow-600">Pending Validation</Badge>
      case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredRestaurants = restaurants.filter((rest: Restaurant) =>
    rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rest.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rest.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingRestaurants = restaurants.filter(r => r.status === 'PENDING')

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">Meenuin</h1>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-medium">{user?.name}</span>
                <Badge variant="outline" className="text-xs">Super Admin</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPasswordResetOpen(true)}>
                <Shield className="h-4 w-4 mr-1" />
                Reset PW
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>


      <main className="container mx-auto px-4 py-8 flex-1">
        <Dialog open={passwordResetOpen} onOpenChange={setPasswordResetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
              <DialogDescription>Enter user email and new password</DialogDescription>
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

        {/* Restaurant Edit Dialog */}
        <Dialog open={restaurantDialogOpen} onOpenChange={setRestaurantDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}</DialogTitle>
              <DialogDescription>
                {editingRestaurant ? 'Update restaurant details' : 'Create a new restaurant profile'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Restaurant Name</Label>
                <Input
                  value={restaurantForm.name || ''}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                  placeholder="e.g. Warung Nusantara"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={restaurantForm.description || ''}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={restaurantForm.address || ''}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={restaurantForm.phone || ''}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                  placeholder="Contact number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Menu Items (0 = Unlimited)</Label>
                  <Input
                    type="number"
                    value={restaurantForm.maxMenuItems || ''}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, maxMenuItems: parseInt(e.target.value) || 0 })}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Admins (0 = Unlimited)</Label>
                  <Input
                    type="number"
                    value={restaurantForm.maxAdmins || ''}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, maxAdmins: parseInt(e.target.value) || 0 })}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Staff (0 = Unlimited)</Label>
                  <Input
                    type="number"
                    value={restaurantForm.maxStaff || ''}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, maxStaff: parseInt(e.target.value) || 0 })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="allowBranches"
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={restaurantForm.allowBranches || false}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, allowBranches: e.target.checked })}
                />
                <Label htmlFor="allowBranches" className="cursor-pointer">Allow Multi-Branch?</Label>
              </div>
              <div className="space-y-2">
                <Label>Restaurant Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, (base64) => setRestaurantForm({ ...restaurantForm, logo: base64 }))}
                />
                {restaurantForm.logo && (
                  <div className="mt-2 w-20 h-20 border rounded overflow-hidden relative">
                    <Image src={restaurantForm.logo} alt="Preview" fill className="object-cover" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRestaurantDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveRestaurant}>{editingRestaurant ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subscription Edit Dialog */}
        <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subscription Plan</DialogTitle>
              <DialogDescription>
                Change subscription plan for {editingSubscription?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Plan</Label>
                <Select value={newSubscriptionType} onValueChange={(val) => setNewSubscriptionType(val as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - Rp {plan.price.toLocaleString('id-ID')}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-500">
                Current Plan: <span className="font-semibold">{editingSubscription?.package}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubscriptionDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateSubscription}>Update Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Plan Edit Dialog */}
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Plan: {editingPlan?.name}</DialogTitle>
              <DialogDescription>
                Modify subscription plan details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input
                  value={planForm.name || ''}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price (Rp)</Label>
                <Input
                  type="number"
                  value={planForm.price || ''}
                  onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Menu Limit</Label>
                <Input
                  type="number"
                  value={planForm.menuLimit || ''}
                  onChange={(e) => setPlanForm({ ...planForm, menuLimit: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={planForm.description || ''}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Features (One per line)</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={typeof planForm.features === 'string' ? planForm.features : ''}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="50 Menu Items&#10;Basic Analytics&#10;Email Support"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePlan}>Save Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Edit Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingUserData?.name || ''}
                  onChange={(e) => setEditingUserData(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editingUserData?.email || ''}
                  onChange={(e) => setEditingUserData(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editingUserData?.role || ''}
                  onValueChange={(val) => setEditingUserData(prev => prev ? { ...prev, role: val } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="RESTAURANT_ADMIN">Restaurant Admin</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>New Password (leave blank to keep current)</Label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={editingUserData?.password || ''}
                  onChange={(e) => setEditingUserData(prev => prev ? { ...prev, password: e.target.value } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Status & Notify</DialogTitle>
              <DialogDescription>
                Send a notification to <b>{selectedRestoForAction?.name}</b> regarding this status change ({selectedRestoForAction?.status}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Notification Channel</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="channel"
                      checked={notificationChannel === 'EMAIL'}
                      onChange={() => setNotificationChannel('EMAIL')}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="channel"
                      checked={notificationChannel === 'WHATSAPP'}
                      onChange={() => setNotificationChannel('WHATSAPP')}
                      className="w-4 h-4 text-emerald-600"
                    />
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmStatusUpdate}>Send & Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRestaurants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Store className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRestaurants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive/Pending</CardTitle>
              <LogOut className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactiveRestaurants}</div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top Restaurants (Revenue)
              </CardTitle>
              <CardDescription>Highest grossing restaurants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminAnalytics.topRevenue.length > 0 ? (
                  adminAnalytics.topRevenue.map((resto, i) => (
                    <div key={resto.id} className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
                          #{i + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{resto.name}</div>
                          <div className="text-xs text-gray-500">{resto.totalOrders} total orders</div>
                        </div>
                      </div>
                      <div className="font-bold text-emerald-600">
                        Rp {resto.totalRevenue.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">No revenue data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Selling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                Top Restaurants (Volume)
              </CardTitle>
              <CardDescription>Highest order volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminAnalytics.topSelling.length > 0 ? (
                  adminAnalytics.topSelling.map((resto, i) => (
                    <div key={resto.id} className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                          #{i + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{resto.name}</div>
                          <div className="text-xs text-gray-500">Rp {resto.totalRevenue.toLocaleString('id-ID')} revenue</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-bold">
                        {resto.totalOrders} orders
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">No order data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="restaurants" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-8">
            <TabsTrigger value="restaurants">Resto</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants" className="space-y-6">

            {/* Pending Validations Section */}
            {pendingRestaurants.length > 0 && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 mb-8">
                <CardHeader>
                  <CardTitle className="text-orange-700 flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Pending Validations
                  </CardTitle>
                  <CardDescription>
                    These restaurants have just registered and are waiting for your approval.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRestaurants.map(restaurant => (
                      <div key={restaurant.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="font-bold text-lg">{restaurant.name}</h3>
                          <p className="text-sm text-gray-600">{restaurant.address} • {restaurant.phone}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{restaurant.package}</Badge>
                            <span className="text-xs text-gray-500 flex items-center">Registered: {new Date().toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleToggleRestaurantStatus(restaurant.id, false, restaurant.name)}>Reject</Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleToggleRestaurantStatus(restaurant.id, true, restaurant.name)}>Approve & Activate</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">Restaurant Management</CardTitle>
                    <CardDescription>Manage all restaurants on the platform</CardDescription>
                  </div>
                </div>
                <div className="relative max-w-md mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-4">
                    {filteredRestaurants.map((restaurant) => (
                      <Card key={restaurant.id} className="border-2">
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
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                                  <Badge {...getSubscriptionBadge(restaurant.package)}>
                                    {getSubscriptionBadge(restaurant.package).label}
                                  </Badge>
                                  {getStatusBadge(restaurant.status)}
                                </div>
                                <CardDescription className="text-sm mb-1">
                                  {restaurant.description}
                                </CardDescription>
                                <div className="text-xs text-gray-500">
                                  {restaurant.adminEmail} • {restaurant.phone}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Switch
                                checked={restaurant.status === 'ACTIVE'}
                                onCheckedChange={(checked) => handleToggleRestaurantStatus(restaurant.id, checked, restaurant.name)}
                              />
                              <Button variant="outline" size="sm" onClick={() => handleEditRestaurantProfile(restaurant)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Profile
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditRestaurantAdmin(restaurant)}>
                                <Users className="h-4 w-4 mr-1" />
                                Edit Admin
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleOpenSubscriptionDialog(restaurant)}>
                                <Zap className="h-4 w-4 mr-1" />
                                Edit Plan
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  console.log('Attempting to delete restaurant:', restaurant.id);
                                  if (confirm(`Are you sure you want to PERMANENTLY delete ${restaurant.name}?`)) {
                                    fetch(`/api/restaurants/${restaurant.id}`, { method: 'DELETE' })
                                      .then(res => res.json())
                                      .then(data => {
                                        if (data.success) {
                                          toast({ title: 'Success', description: 'Restaurant deleted' })
                                          fetchDashboardData()
                                        } else {
                                          toast({ title: 'Error', variant: 'destructive', description: data.error })
                                        }
                                      })
                                      .catch(err => toast({ title: 'Error', variant: 'destructive', description: 'Failed to delete' }))
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-0 border-t bg-gray-50/50">
                <div className="w-full p-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Showing {filteredRestaurants.length} of {restaurants.length} restaurants</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <div className="grid md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan, idx) => {
                const colorClasses = [
                  'bg-blue-50 border-blue-200',
                  'bg-emerald-50 border-emerald-200',
                  'bg-purple-50 border-purple-200'
                ]
                const isPopular = plan.id === 'PRO'
                return (
                  <Card key={plan.id} className={`relative border-2 ${colorClasses[idx % 3]} ${isPopular ? 'shadow-lg scale-105 z-10' : ''}`}>
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Most Popular
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-2xl font-bold text-slate-800 mt-2">
                        Rp {plan.price.toLocaleString('id-ID')}
                      </CardDescription>
                      {plan.description && (
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, fidx) => (
                          <li key={fidx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="text-sm text-gray-500 mt-3">
                        Menu Limit: {plan.menuLimit} items
                      </div>
                      <div className="mt-6">
                        <Button className="w-full" variant="outline" onClick={() => handleEditPlan(plan)}>
                          Edit Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">User Management</h2>
              <Button onClick={() => {
                // Open Add User Dialog (need to add state for this)
                // For simplified demo, just show toast as "Coming Soon" or implement basic add
                toast({ title: 'Info', description: 'User creation coming soon via full dialog' })
              }}><Plus className="h-4 w-4 mr-2" /> Add User</Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                      <tr>
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Role</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="p-4">{u.name}</td>
                          <td className="p-4">{u.email}</td>
                          <td className="p-4"><Badge variant="outline">{u.role}</Badge></td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setEditingUserData({ id: u.id, name: u.name, email: u.email, role: u.role, password: u.password || '' })
                                  setUserDialogOpen(true)
                                }}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => {
                                  if (confirm('Are you sure?')) deleteUser(u.id)
                                }}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* System Tab */}
          <TabsContent value="system" className="space-y-4">
            {/* Announcements Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  System Announcements & Health
                </CardTitle>
                <CardDescription>Manage global notifications and system status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Maintenance Mode</h4>
                    <div className="flex items-center gap-4">
                      <Switch id="maintenance-mode" />
                      <Label htmlFor="maintenance-mode">Enable System Maintenance (Restricts Login)</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Broadcast Message</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message to all users..."
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                      />
                      <Button onClick={() => {
                        if (broadcastMsg.trim()) {
                          broadcastAnnouncement(broadcastMsg)
                          setBroadcastMsg('')
                          toast({ title: 'Sent', description: 'Announcement broadcasted successfully.' })
                        }
                      }}>Send</Button>
                      <Button variant="outline" onClick={() => {
                        useAppStore.getState().clearAnnouncement()
                        toast({ title: 'Cleared', description: 'System announcements disabled.' })
                      }}>Clear</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Helpdesk Settings</CardTitle>
                <CardDescription>Configure global system settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 max-w-xl">
                  <div className="grid gap-2">
                    <Label>Helpdesk WhatsApp Number</Label>
                    <Input
                      value={helpdeskSettings?.whatsapp || ''}
                      onChange={(e) => updateHelpdeskSettings({ ...helpdeskSettings, whatsapp: e.target.value })}
                      placeholder="e.g. 6281234567890"
                    />
                    <p className="text-xs text-gray-500">Number for the Helpdesk button in Restaurant Admin</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Support Email</Label>
                    <Input
                      value={helpdeskSettings?.email || ''}
                      onChange={(e) => updateHelpdeskSettings({ ...helpdeskSettings, email: e.target.value })}
                      placeholder="support@meenuin.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-red-600">
                  Actions here can cause irreversible data loss. Proceed with caution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-white dark:bg-gray-900">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Reset System Data</h4>
                    <p className="text-sm text-gray-500">Clears all users, restaurants, orders, and restores initial mock data.</p>
                  </div>
                  <Button variant="destructive" onClick={() => {
                    if (confirm('FABULOUS WARNING: This will wipe all data and log you out. Continue?')) {
                      resetSystem()
                    }
                  }}>Reset System</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-900 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="font-bold text-lg mb-1">Meenuin Super Admin</p>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} PT Meenuin Teknologi Indonesia. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            RestoHub v3.0.2-stable • Docker Build 2402
          </p>
        </div>
      </footer>
    </div >
  )
}
