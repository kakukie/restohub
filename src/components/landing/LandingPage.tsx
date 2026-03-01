'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Store, CheckCircle, Smartphone, QrCode, Zap, Shield, Users, TrendingUp, Clock } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app-store'

interface SubscriptionPlan {
  id: 'BASIC' | 'PRO' | 'ENTERPRISE'
  name: string
  description: string
  price: number
  menuLimit: number
  features: string[]
  isActive: boolean
}

// Mock subscription plans (in real app, these would come from API)
const subscriptionPlansMock: SubscriptionPlan[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    description: 'Perfect for small restaurants',
    price: 99000,
    menuLimit: 50,
    features: ['50 Menu Items', 'Basic Analytics', 'Email Support', 'QR Code Generation', 'Digital Menu'],
    isActive: true
  },
  {
    id: 'PRO',
    name: 'Pro',
    description: 'For growing businesses',
    price: 199000,
    menuLimit: 100,
    features: ['100 Menu Items', 'Advanced Analytics', 'Priority Support', 'QR Code Generation', 'Custom Branding', 'Digital Menu'],
    isActive: true
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large operations',
    price: 499000,
    menuLimit: 200,
    features: ['200 Menu Items', 'Full Analytics', '24/7 Support', 'QR Code Generation', 'Custom Branding', 'API Access', 'Multi-location', 'Digital Menu'],
    isActive: true
  }
]

// Fetch plans from API
export default function LandingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const { helpdeskSettings } = useAppStore()

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/subscription-plans')
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          setPlans(data.data)
        } else {
          // Fallback to mock if API fails or empty (for initial load)
          setPlans(subscriptionPlansMock)
        }
      } catch (error) {
        console.error("Failed to load plans", error)
        setPlans(subscriptionPlansMock)
      }
    }
    fetchPlans()
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    restaurantName: '',
    address: '',
    subscriptionPlan: 'BASIC' as string // Relaxed type for dynamic IDs
  })
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRegister = () => {
    if (!formData.name || !formData.email || !formData.restaurantName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    // In real app, send data to API
    console.log('Registration data:', formData)

    toast({
      title: 'Registration Successful!',
      description: 'Thank you for registering! We will contact you shortly.',
    })

    setRegisterDialogOpen(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      restaurantName: '',
      address: '',
      subscriptionPlan: 'BASIC'
    })
  }

  const getSelectedPlan = () => {
    return plans.find(p => p.id === formData.subscriptionPlan)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Store className="h-12 w-12 text-orange-600" />
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
              {helpdeskSettings?.platformName || 'RestoHub'}
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Platform Digital Restaurant Terlengkap untuk Mengelola Menu, Pesanan, dan Pelanggan Anda
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8">
                  <Store className="h-5 w-5 mr-2" />
                  Daftar Sekarang
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Daftar Restoran Anda</DialogTitle>
                  <DialogDescription>
                    Isi data restoran Anda untuk memulai menggunakan {helpdeskSettings?.platformName || 'RestoHub'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Pemilik *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nama lengkap Anda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@contoh.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+62 812 3456 7890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurantName">Nama Restoran *</Label>
                    <Input
                      id="restaurantName"
                      value={formData.restaurantName}
                      onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                      placeholder="Nama restoran Anda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Restoran</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Alamat lengkap restoran"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionPlan">Pilih Paket *</Label>
                    <Select
                      value={formData.subscriptionPlan}
                      onValueChange={(value) => handleInputChange('subscriptionPlan', value)}
                    >
                      <SelectTrigger id="subscriptionPlan">
                        <SelectValue placeholder="Pilih paket" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - Rp {plan.price.toLocaleString()}/bulan
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleRegister} className="bg-orange-600 hover:bg-orange-700">
                    Daftar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="lg">
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Fitur Unggulan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>QR Code Menu</CardTitle>
                <CardDescription>
                  Pelanggan bisa scan QR code untuk melihat menu digital
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Menu Digital</CardTitle>
                <CardDescription>
                  Kelola menu restoran Anda dengan mudah secara online
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Pesanan Cepat</CardTitle>
                <CardDescription>
                  Terima pesanan secara real-time dari pelanggan
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Analitik</CardTitle>
                <CardDescription>
                  Pantau performa restoran dengan laporan detail
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Pilih Paket yang Tepat
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Dapatkan semua fitur yang Anda butuhkan dengan harga yang terjangkau
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`border-2 transition-all hover:shadow-lg ${formData.subscriptionPlan === plan.id
                  ? 'border-orange-600 shadow-xl'
                  : 'border-gray-200 dark:border-gray-700'
                  }`}
              >
                <CardHeader>
                  {plan.id === 'PRO' && (
                    <Badge className="self-start mb-2 bg-orange-600 text-white">Paling Populer</Badge>
                  )}
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-1">
                      Rp {plan.price.toLocaleString()}
                    </div>
                    <div className="text-gray-500">/ bulan</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Users className="h-4 w-4 text-green-600" />
                      <span>{plan.menuLimit} Item Menu</span>
                    </div>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => {
                      handleInputChange('subscriptionPlan', plan.id)
                      setRegisterDialogOpen(true)
                    }}
                    className={`w-full ${formData.subscriptionPlan === plan.id
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                      }`}
                  >
                    {formData.subscriptionPlan === plan.id ? 'Pilih Paket Ini' : 'Pilih Paket'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Cara Kerja
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="h-16 w-16 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Daftar</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Daftar restoran Anda dan pilih paket yang sesuai
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Buat Menu</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload menu restoran Anda ke platform kami
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Selesai</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Pelanggan scan QR code dan pesan langsung dari meja
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-orange-600 to-amber-600 text-white border-0">
            <CardContent className="py-12 px-8">
              <Store className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">
                Siap Digitalisasi Restoran Anda?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Bergabung dengan ribuan restoran lainnya yang telah sukses dengan {helpdeskSettings?.platformName || 'RestoHub'}
              </p>
              <Button
                size="lg"
                onClick={() => setRegisterDialogOpen(true)}
                className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8"
              >
                Mulai Sekarang - Gratis!
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              © 2024 {helpdeskSettings?.platformName || 'RestoHub'}. Platform Digital Restaurant Indonesia
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Aman & Terpercaya</span>
              <Clock className="h-4 w-4 ml-4" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
