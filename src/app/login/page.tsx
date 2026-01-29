'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Store, Utensils } from 'lucide-react'

export default function RestaurantAdminLoginPage() {
    const { setUser, user } = useAppStore()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    // Simple math captcha
    const [captchaNum1, setCaptchaNum1] = useState(0)
    const [captchaNum2, setCaptchaNum2] = useState(0)
    const [captchaAnswer, setCaptchaAnswer] = useState('')

    useEffect(() => {
        setMounted(true)
        useAppStore.persist.rehydrate()
        generateCaptcha()

        // If already logged in
        if (user && user.role === 'RESTAURANT_ADMIN') {
            router.push('/') // Redirect to dashboard (handled by page.tsx)
        }
    }, [user, router])

    const generateCaptcha = () => {
        setCaptchaNum1(Math.floor(Math.random() * 10) + 1)
        setCaptchaNum2(Math.floor(Math.random() * 10) + 1)
        setCaptchaAnswer('')
    }

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
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
            const { users, restaurants } = useAppStore.getState()

            // Hardcoded default restaurant admin users (matching page.tsx)
            const defaultUsers = [
                { id: 'u2', name: 'Resto Admin', email: 'resto@admin.com', role: 'RESTAURANT_ADMIN', restaurantId: '1', password: 'resto123' },
                { id: 'u2-alt', name: 'Resto Admin (Alt)', email: 'u@resto.com', role: 'RESTAURANT_ADMIN', restaurantId: '1', password: 'password' },
                { id: 'u4', name: 'Sushi Admin', email: 'sushi@admin.com', role: 'RESTAURANT_ADMIN', restaurantId: '2', password: 'sushi123' },
                { id: 'u5', name: 'Pizza Admin', email: 'pizza@admin.com', role: 'RESTAURANT_ADMIN', restaurantId: '3', password: 'pizza123' },
                ...users.filter(u => u.role === 'RESTAURANT_ADMIN')
            ]

            const foundUser = defaultUsers.find(
                (u) => u.email.toLowerCase() === formData.email.toLowerCase() &&
                    u.password === formData.password
            )

            if (foundUser) {
                // Find restaurant
                const userRestaurant = restaurants.find(r => r.id === foundUser.restaurantId)
                if (!userRestaurant && foundUser.restaurantId !== 'new') {
                    // Fallback if restaurant not found in store but ID exists
                }

                const userToStore = {
                    ...foundUser,
                    restaurant: userRestaurant
                }

                setUser(userToStore as any)
                toast({ title: 'Login Berhasil', description: `Selamat datang, ${foundUser.name}` })
                router.push('/') // Redirect to home which handles dashboard rendering
            } else {
                toast({ title: 'Login Gagal', description: 'Email atau password salah', variant: 'destructive' })
                generateCaptcha()
            }
        } catch (error) {
            console.error(error)
            toast({ title: 'Error', description: 'Terjadi kesalahan sistem', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-2">
                        <div className="bg-emerald-100 p-3 rounded-full">
                            <Store className="h-8 w-8 text-emerald-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Partner Login</CardTitle>
                    <CardDescription>
                        Masuk untuk mengelola restoran Anda
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            placeholder="resto@admin.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    {/* Captcha */}
                    <div className="space-y-2 p-3 bg-gray-100 rounded-lg">
                        <Label className="flex items-center gap-2 text-sm text-gray-600">
                            Verifikasi Keamanan
                        </Label>
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-emerald-600">
                                {captchaNum1} + {captchaNum2} = ?
                            </span>
                            <Input
                                type="number"
                                placeholder="Hasil"
                                value={captchaAnswer}
                                onChange={(e) => setCaptchaAnswer(e.target.value)}
                                className="w-24 bg-white"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={generateCaptcha}
                            >
                                🔄
                            </Button>
                        </div>
                    </div>

                    <Button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {loading ? 'Memproses...' : 'Masuk Dashboard'}
                    </Button>

                    <div className="text-center pt-4 border-t mt-4">
                        <p className="text-sm text-gray-500 mb-2">Belum punya akun?</p>
                        <Button variant="outline" className="w-full" onClick={() => router.push('/register')}>
                            Daftar Mitra Baru
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
