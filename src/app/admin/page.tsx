'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { ShieldCheck, Utensils } from 'lucide-react'

export default function AdminLoginPage() {
    const { setUser, user } = useAppStore()
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
        setMounted(true)
        // useAppStore.persist.rehydrate() // Auto-hydration handles this
        generateCaptcha()

        // Check if user is already logged in (hydrated from sessionStorage)
        if (user && user.role === 'SUPER_ADMIN') {
            // Already handled by the return statement check below
        }
    }, [setUser])

    const generateCaptcha = () => {
        setCaptchaNum1(Math.floor(Math.random() * 10) + 1)
        setCaptchaNum2(Math.floor(Math.random() * 10) + 1)
        setCaptchaAnswer('')
    }

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    // If already logged in as admin, show dashboard
    if (user && user.role === 'SUPER_ADMIN') {
        return <SuperAdminDashboard />
    }

    const handleLogin = async () => {
        // Validate captcha
        const correctAnswer = captchaNum1 + captchaNum2
        if (parseInt(captchaAnswer) !== correctAnswer) {
            toast({ title: 'Captcha Error', description: 'Incorrect captcha answer', variant: 'destructive' })
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
            if (userData.role !== 'SUPER_ADMIN') {
                toast({ title: 'Access Denied', description: 'This portal is for Super Admins only.', variant: 'destructive' })
                return
            }

            localStorage.setItem('user', JSON.stringify(userData))
            setUser(userData)
            toast({ title: 'Welcome back!', description: `Logged in as ${userData.name}` })

        } catch (error: any) {
            console.error('Login Error:', error)
            toast({ title: 'Login Failed', description: error.message, variant: 'destructive' })
            generateCaptcha()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-emerald-600 p-3 rounded-xl">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-white">Admin Portal</CardTitle>
                    <CardDescription className="text-gray-400">
                        Secure login for Meenuin administrators
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-gray-300">Email</Label>
                        <Input
                            type="email"
                            placeholder="admin@meenuin.biz.id"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-gray-300">Password</Label>
                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500"
                        />
                    </div>

                    {/* Captcha */}
                    <div className="space-y-2 p-3 bg-gray-700 rounded-lg">
                        <Label className="text-gray-300 flex items-center gap-2">
                            🤖 Verify you&apos;re not a robot
                        </Label>
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-emerald-400">
                                {captchaNum1} + {captchaNum2} = ?
                            </span>
                            <Input
                                type="number"
                                placeholder="Answer"
                                value={captchaAnswer}
                                onChange={(e) => setCaptchaAnswer(e.target.value)}
                                className="w-24 bg-gray-600 border-gray-500 text-white"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={generateCaptcha}
                                className="text-gray-400 hover:text-white"
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
                        {loading ? 'Logging in...' : 'Login to Admin Panel'}
                    </Button>

                    <div className="text-center pt-4">
                        <a href="/" className="text-sm text-gray-400 hover:text-emerald-400 flex items-center justify-center gap-2">
                            <Utensils className="h-4 w-4" />
                            Back to Restaurant Portal
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
