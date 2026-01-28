'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import CustomerDashboard from '@/components/dashboards/CustomerDashboard'
import RestaurantAdminDashboard from '@/components/dashboards/RestaurantAdminDashboard'
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Utensils, ArrowRight, Store, CheckCircle, Smartphone, CreditCard, ChefHat } from 'lucide-react'

export default function Home() {
  const { setUser, user } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'RESTAURANT_ADMIN',
    password: '',
    plan: 'FREE_TRIAL'
  })

  // Captcha state
  const [captchaNum1, setCaptchaNum1] = useState(0)
  const [captchaNum2, setCaptchaNum2] = useState(0)
  const [captchaAnswer, setCaptchaAnswer] = useState('')

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1)
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1)
    setCaptchaAnswer('')
  }

  // Initialize and check session
  useEffect(() => {
    setMounted(true)
    useAppStore.persist.rehydrate()
    generateCaptcha()

    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)

        // [REAL APP] Fetch latest data from API
        // Fetch restaurants (for Super Admin or general catalog)
        fetch('/api/restaurants')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data) {
              useAppStore.getState().setRestaurants(data.data)
            }
          })
          .catch(err => console.error('Failed to fetch restaurants:', err))

      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('user')
      }
    }
  }, [setUser])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Dashboard Routing
  if (user) {
    switch (user.role) {
      case 'CUSTOMER':
        return <CustomerDashboard />
      case 'RESTAURANT_ADMIN':
        return <RestaurantAdminDashboard />
      case 'SUPER_ADMIN':
        return <SuperAdminDashboard />
      default:
        return (
          <div className="min-h-screen flex items-center justify-center flex-col gap-4">
            <h1 className="text-2xl font-bold text-red-500">Error: Invalid User Role</h1>
            <p>Your account has an unknown role: {user.role}</p>
            <Button onClick={() => {
              localStorage.removeItem('user')
              window.location.reload()
            }}>Logout & Reset</Button>
          </div>
        )
    }
  }

  const handleLogin = async () => {
    // Validate captcha
    const correctAnswer = captchaNum1 + captchaNum2
    if (parseInt(captchaAnswer) !== correctAnswer) {
      toast({ title: 'Captcha Error', description: 'Jawaban captcha salah', variant: 'destructive' })
      generateCaptcha()
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      const userData = data.user
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      toast({ title: 'Selamat Datang!', description: `Login sebagai ${userData.name}` })

    } catch (error: any) {
      console.error('Login Error:', error)
      toast({
        title: 'Login Gagal',
        description: error.message,
        variant: 'destructive',
      })
      generateCaptcha()
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    // Validate captcha
    const correctAnswer = captchaNum1 + captchaNum2
    if (parseInt(captchaAnswer) !== correctAnswer) {
      toast({ title: 'Captcha Error', description: 'Jawaban captcha salah', variant: 'destructive' })
      generateCaptcha()
      return
    }

    setLoading(true)
    try {
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Silakan isi semua field')
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          plan: (formData as any).plan || 'FREE_TRIAL',
          role: 'RESTAURANT_ADMIN'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registrasi gagal')
      }

      // Note: We don't utilize addRestaurant/addUser store actions here because 
      // the data is now in the database. When the super admin loads their dashboard,
      // they should fetch from the API.

      toast({
        title: 'Registrasi Berhasil!',
        description: 'Akun Anda telah dibuat. Silakan login.',
      })

      setActiveTab('login')
      setFormData({ name: '', email: '', phone: '', role: 'RESTAURANT_ADMIN', password: '', plan: 'FREE_TRIAL' })
      generateCaptcha()

    } catch (error: any) {
      toast({
        title: 'Registrasi Gagal',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  /* Contact Section */
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const ContactSection = () => (
    <div id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Contact Us</h2>
        <div className="flex flex-col md:flex-row justify-center gap-8 text-slate-600">
          <div className="flex flex-col items-center p-6 bg-emerald-50 rounded-xl">
            <Smartphone className="h-8 w-8 text-emerald-600 mb-4" />
            <h3 className="font-bold mb-2">WhatsApp</h3>
            <p>0812-3456-7890</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-emerald-50 rounded-xl">
            <CheckCircle className="h-8 w-8 text-emerald-600 mb-4" />
            <h3 className="font-bold mb-2">Email</h3>
            <p>support@meenuin.biz.id</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex flex-col font-sans text-slate-800">

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              Meenuin
            </span>
          </div>
          <div className="flex gap-4 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-emerald-600">Fitur</a>
            <a href="#pricing" className="hover:text-emerald-600">Harga</a>
            <a href="#contact" className="hover:text-emerald-600">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 container mx-auto px-4 py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-12">

        {/* Left: Content */}
        <div className="lg:w-1/2 space-y-8 text-center lg:text-left">
          <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight text-slate-900">
            Digital Menu & <br />
            <span className="text-emerald-600">Restaurant POS</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Upgrade restoran Anda dengan Meenuin. Pesanan tanpa kontak, pembayaran terintegrasi (QRIS), dan manajemen dapur dalam satu platform.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-6 pt-4" id="features">
            <div className="flex flex-col items-center lg:items-start gap-2">
              <div className="bg-emerald-100 p-3 rounded-xl">
                <Smartphone className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium">QR Menu</span>
            </div>
            <div className="flex flex-col items-center lg:items-start gap-2">
              <div className="bg-emerald-100 p-3 rounded-xl">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium">QRIS Pay</span>
            </div>
            <div className="flex flex-col items-center lg:items-start gap-2">
              <div className="bg-emerald-100 p-3 rounded-xl">
                <ChefHat className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="text-sm font-medium">Kitchen Display</span>
            </div>
          </div>

          <div className="pt-8 grid grid-cols-3 gap-8 border-t border-gray-100">
            <div>
              <h4 className="font-bold text-2xl text-slate-900">100+</h4>
              <p className="text-slate-500 text-sm">Merchants</p>
            </div>
            <div>
              <h4 className="font-bold text-2xl text-slate-900">50k+</h4>
              <p className="text-slate-500 text-sm">Orders</p>
            </div>
            <div>
              <h4 className="font-bold text-2xl text-slate-900">99%</h4>
              <p className="text-slate-500 text-sm">Uptime</p>
            </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <div className="lg:w-1/2 w-full max-w-md">
          <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-50 p-6 border-b border-gray-100">
              <h3 className="font-bold text-lg text-center text-slate-800">Portal Restoran</h3>
              <p className="text-center text-slate-500 text-sm">Login atau daftar restoran baru</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none bg-transparent p-0 border-b">
                <TabsTrigger
                  value="login"
                  className="rounded-none py-3 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600"
                >
                  <Store className="h-4 w-4 mr-1" /> Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-none py-3 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600"
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Daftar
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <div className="p-6 pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      name="email"
                      placeholder="email@restoran.com"
                      className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-emerald-500"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      name="password"
                      className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-emerald-500"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Captcha */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <Label className="flex items-center gap-2 text-gray-600">
                      🤖 Verifikasi bukan robot
                    </Label>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-emerald-600">
                        {captchaNum1} + {captchaNum2} = ?
                      </span>
                      <Input
                        type="number"
                        placeholder="Jawaban"
                        value={captchaAnswer}
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                        className="w-24 h-10"
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={generateCaptcha}>
                        🔄
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? 'Memproses...' : 'Masuk'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <div className="p-6 pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Restoran</Label>
                    <Input
                      name="name"
                      placeholder="Warung Makan Enak"
                      className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-emerald-500"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      name="email"
                      placeholder="owner@restoran.com"
                      className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-emerald-500"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nomor HP</Label>
                    <Input
                      name="phone"
                      placeholder="0812..."
                      className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-emerald-500"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      name="password"
                      className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-emerald-500"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pilih Paket</Label>
                    <Select
                      value={(formData as any).plan}
                      onValueChange={(val) => setFormData({ ...formData, plan: val } as any)}
                    >
                      <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Pilih Paket" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE_TRIAL">Free Trial - Rp 0</SelectItem>
                        <SelectItem value="BASIC">Basic - Rp 199.000</SelectItem>
                        <SelectItem value="PRO">Pro - Rp 499.000</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise - Rp 999.000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Captcha */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <Label className="flex items-center gap-2 text-gray-600">
                      🤖 Verifikasi bukan robot
                    </Label>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-emerald-600">
                        {captchaNum1} + {captchaNum2} = ?
                      </span>
                      <Input
                        type="number"
                        placeholder="Jawaban"
                        value={captchaAnswer}
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                        className="w-24 h-10"
                      />
                      <Button type="button" variant="ghost" size="sm" onClick={generateCaptcha}>
                        🔄
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
                    onClick={handleRegister}
                    disabled={loading}
                  >
                    {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="text-center text-xs text-gray-400 pb-6">
              Protected by Meenuin Secure Login
            </div>
          </Card>
        </div>
      </div>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-emerald-50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-emerald-900">Simple, Transparent Pricing</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Choose the perfect plan for your restaurant. No hidden fees, cancel anytime.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {useAppStore.getState().subscriptionPlans.map((plan) => (
              <Card key={plan.id} className={`border-2 ${plan.name === 'Pro' ? 'border-emerald-500 shadow-xl relative' : 'border-gray-200 hover:border-emerald-300'} transition-all duration-300`}>
                {plan.name === 'Pro' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-8 flex flex-col h-full">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-500 mb-6 text-sm">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">Rp {plan.price.toLocaleString('id-ID')}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <ul className="mb-8 space-y-3 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full h-12 ${plan.name === 'Pro' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50'}`}
                    onClick={() => {
                      const registerTab = document.querySelector('[value="register"]') as HTMLElement
                      if (registerTab) registerTab.click()
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    {plan.id === 'FREE_TRIAL' ? 'Start Free Trial' : `Choose ${plan.name}`}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-slate-500 text-sm">
        <p>© 2026 Meenuin Technology. All rights reserved.</p>
        <p className="mt-2 text-xs font-mono text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
          v3.0.0 Meenuin • Build 2401
        </p>
      </footer>
    </div>
  )
}
