'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/app-store'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'

export default function RestaurantSettingsForm({ restaurantId }: { restaurantId: string }) {
    const { restaurants, updateRestaurant } = useAppStore()
    const restaurant = restaurants.find(r => r.id === restaurantId)

    const [form, setForm] = useState<{
        name: string;
        description: string;
        address: string;
        phone: string;
        logo?: string;
        theme: 'modern-emerald' | 'classic-orange' | 'minimal-blue';
    }>({
        name: '',
        description: '',
        address: '',
        phone: '',
        logo: '',
        theme: 'modern-emerald'
    })

    useEffect(() => {
        if (restaurant) {
            setForm({
                name: restaurant.name,
                description: restaurant.description,
                address: restaurant.address,
                phone: restaurant.phone,
                logo: restaurant.logo,
                theme: restaurant.theme as any || 'modern-emerald'
            })
        }
    }, [restaurant])

    if (!restaurant) return <div>Restaurant not found</div>

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/restaurants/${restaurant.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: restaurant.id, ...form })
            })

            const data = await res.json()
            if (data.success) {
                updateRestaurant(restaurant.id, form)
                toast({ title: 'Success', description: 'Restaurant settings updated' })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to update settings' })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Update your restaurant information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Restaurant Name</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Logo</Label>
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                    setForm({ ...form, logo: reader.result as string })
                                }
                                reader.readAsDataURL(file)
                            }
                        }}
                    />
                    {form.logo && (
                        <div className="mt-2 relative w-20 h-20 border rounded overflow-hidden">
                            <Image src={form.logo} alt="Logo" fill className="object-cover" />
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label>Menu Theme</Label>
                    <Select
                        value={form.theme}
                        onValueChange={(val: any) => setForm({ ...form, theme: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="modern-emerald">Modern Emerald (Default)</SelectItem>
                            <SelectItem value="classic-orange">Classic Orange</SelectItem>
                            <SelectItem value="minimal-blue">Minimal Blue</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="mt-2 p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                        <span className="text-sm font-medium">Theme Preview:</span>
                        <div className="flex gap-2">
                            {/* Primary Color */}
                            <div className={`h-8 w-8 rounded-full shadow-sm ${form.theme === 'classic-orange' ? 'bg-orange-600' :
                                form.theme === 'minimal-blue' ? 'bg-slate-900' : 'bg-emerald-600'
                                }`} title="Primary Color"></div>
                            {/* Secondary/Light Color */}
                            <div className={`h-8 w-8 rounded-full shadow-sm ${form.theme === 'classic-orange' ? 'bg-orange-100' :
                                form.theme === 'minimal-blue' ? 'bg-slate-100' : 'bg-emerald-100'
                                }`} title="Accent Color"></div>
                            {/* Gradient Preview */}
                            <div className={`h-8 w-16 rounded-md shadow-sm bg-gradient-to-r ${form.theme === 'classic-orange' ? 'from-orange-600 to-red-600' :
                                form.theme === 'minimal-blue' ? 'from-slate-900 to-slate-800' : 'from-emerald-600 to-teal-600'
                                }`} title="Header Gradient"></div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Preview changes by visiting your public menu link.</p>
                </div>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Save Changes</Button>
            </CardContent>
        </Card>
    )
}
