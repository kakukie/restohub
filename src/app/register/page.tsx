'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore, Restaurant } from '@/store/app-store' // Assuming Restaurant type is exported
import { Store, UtensilsCrossed, CheckCircle2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function Register() {
    const router = useRouter()
    const { addRestaurant, helpdeskSettings } = useAppStore()
    const [loading, setLoading] = useState(false)
    const [captchaVerified, setCaptchaVerified] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        adminEmail: '',
        adminPassword: '',
        package: 'FREE_TRIAL',
        description: ''
    })

    // Packages definition
    const packages = [
        { id: 'FREE_TRIAL', name: 'Free Trial', price: 'Rp 0', features: ['10 Menu Items', 'Basic Reporting', '1 Admin Account'] },
        { id: 'BASIC', name: 'Basic', price: 'Rp 150.000', features: ['Unlimited Menu', 'Standard Support', '3 Admin Accounts'] },
        { id: 'PRO', name: 'Pro', price: 'Rp 250.000', features: ['Everything in Basic', 'Advanced Analytics', 'Priority Support'] },
        { id: 'ENTERPRISE', name: 'Enterprise', price: 'Contact Us', features: ['Custom Solutions', 'Dedicated Manager', 'API Access'] }
    ]

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handlePackageChange = (value: string) => {
        setFormData({ ...formData, package: value })
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!captchaVerified) {
            toast({
                title: "Validation Error",
                description: "Please verify you are not a robot",
                variant: "destructive"
            })
            return
        }

        setLoading(true)

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500))

            const newRestaurant: Restaurant = {
                id: crypto.randomUUID(),
                name: formData.name,
                description: formData.description || `Best food at ${formData.name}`,
                address: formData.address,
                phone: formData.phone,
                package: formData.package as any,
                rating: 5.0, // New restaurants start high!
                adminEmail: formData.adminEmail,
                status: 'PENDING',
                slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                // In a real app we'd create the User account here too
            }

            addRestaurant(newRestaurant)

            toast({
                title: "Registration Successful",
                description: "Your restaurant has been registered!",
            })

            // Redirect to login (or dashboard if we auto-login)
            router.push('/')
        } catch (error) {
            toast({
                title: "Error",
                description: "Registration failed. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
            <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4">
                <div className="container mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <UtensilsCrossed className="h-8 w-8 text-orange-600" />
                        <span className="text-xl font-bold">{helpdeskSettings?.platformName || 'RestoHub'}</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
                <Card className="max-w-4xl w-full border-0 shadow-xl overflow-hidden flex flex-col md:flex-row">
                    {/* Left Side: Info */}
                    <div className="md:w-5/12 bg-orange-600 p-8 text-white flex flex-col justify-center">
                        <Store className="h-16 w-16 mb-6 opacity-90" />
                        <h2 className="text-3xl font-bold mb-4">Partner with {helpdeskSettings?.platformName || 'RestoHub'}</h2>
                        <p className="mb-6 opacity-90">Join thousands of restaurants growing their business with our digital platform.</p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5" />
                                <span>Easy Menu Management</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5" />
                                <span>QRIS & E-Wallet Integration</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5" />
                                <span>Real-time Order Tracking</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="md:w-7/12 bg-white dark:bg-gray-950 p-8">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Register Restaurant</h1>
                            <p className="text-sm text-gray-500">Create your account to accept orders today</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Restaurant Name</Label>
                                <Input id="name" name="name" required placeholder="e.g. Warung Sedap" value={formData.name} onChange={handleChange} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="adminEmail">Email Address</Label>
                                    <Input id="adminEmail" name="adminEmail" type="email" required placeholder="admin@resto.com" value={formData.adminEmail} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">WhatsApp / Phone</Label>
                                    <Input id="phone" name="phone" type="tel" required placeholder="0812..." value={formData.phone} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" name="address" required placeholder="Full address" value={formData.address} onChange={handleChange} />
                            </div>

                            <div className="space-y-2">
                                <Label>Select Package</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {packages.map((pkg) => (
                                        <div
                                            key={pkg.id}
                                            className={`border rounded-lg p-3 cursor-pointer transition-all ${formData.package === pkg.id ? 'border-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'hover:border-gray-400'}`}
                                            onClick={() => handlePackageChange(pkg.id)}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-sm">{pkg.name}</span>
                                                {formData.package === pkg.id && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-1">{pkg.price}</p>
                                            <p className="text-[10px] text-gray-400">{pkg.features[0]}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Robot Validation (Mock) */}
                            <div className="flex items-center space-x-2 border p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                                <Checkbox id="captcha" checked={captchaVerified} onCheckedChange={(c) => setCaptchaVerified(c as boolean)} />
                                <label
                                    htmlFor="captcha"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                                >
                                    I am not a robot
                                </label>
                            </div>

                            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Register Now'}
                            </Button>
                        </form>
                    </div>
                </Card>
            </main>
        </div>
    )
}
