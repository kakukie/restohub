'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/store/app-store'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'
import { Trash2, MapPin, Map, Globe, Store, Palette, ImageIcon } from 'lucide-react'

export default function RestaurantSettingsForm({ restaurantId }: { restaurantId: string }) {
    const { restaurants, updateRestaurant } = useAppStore()
    const restaurant = restaurants.find(r => r.id === restaurantId)

    const [form, setForm] = useState<{
        name: string;
        description: string;
        address: string;
        detailAddress: string;
        latitude: string;
        longitude: string;
        googleMapsUrl: string;
        phone: string;
        logo?: string;
        banner?: string;
        slug: string;
        theme: 'modern-emerald' | 'classic-orange' | 'minimal-blue';
    }>({
        name: '',
        description: '',
        address: '',
        detailAddress: '',
        latitude: '',
        longitude: '',
        googleMapsUrl: '',
        phone: '',
        logo: '',
        banner: '',
        slug: '',
        theme: 'modern-emerald'
    })

    useEffect(() => {
        if (restaurant) {
            setForm({
                name: restaurant.name,
                description: restaurant.description || '',
                address: restaurant.address || '',
                detailAddress: restaurant.detailAddress || '',
                latitude: restaurant.latitude?.toString() || '',
                longitude: restaurant.longitude?.toString() || '',
                googleMapsUrl: restaurant.googleMapsUrl || '',
                phone: restaurant.phone || '',
                logo: restaurant.logo,
                banner: restaurant.banner,
                slug: restaurant.slug || '',
                theme: restaurant.theme as any || 'modern-emerald'
            })
        }
    }, [restaurant])

    if (!restaurant) return <div>Restaurant not found</div>

    const handleSave = async () => {
        try {
            // Validate Lat/Long
            const lat = form.latitude ? parseFloat(form.latitude) : undefined
            const lng = form.longitude ? parseFloat(form.longitude) : undefined

            const payload: any = {
                id: restaurant.id,
                ...form,
                latitude: lat,
                longitude: lng
            }

            const res = await fetch(`/api/restaurants/${restaurant.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                updateRestaurant(restaurant.id, payload)
                toast({ title: 'Success', description: 'Restaurant settings updated' })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive', description: 'Failed to update settings' })
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Restaurant Settings</CardTitle>
                <CardDescription>Manage your restaurant profile, location, and branding.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="info" className="flex items-center gap-2">
                            <Store className="h-4 w-4" /> Info
                        </TabsTrigger>
                        <TabsTrigger value="location" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Location
                        </TabsTrigger>
                        <TabsTrigger value="branding" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" /> Branding
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab: Info */}
                    <TabsContent value="info" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Restaurant Name</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Menu URL Slug</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={form.slug}
                                    onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                                    placeholder="warung-sari-rasa"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        const autoSlug = form.name.toLowerCase()
                                            .replace(/[^a-z0-9]+/g, '-')
                                            .replace(/^-+|-+$/g, '')
                                        setForm({ ...form, slug: autoSlug })
                                    }}
                                >
                                    Auto
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Public Menu: <span className="font-mono text-emerald-600">/menu/{form.slug || 'your-slug'}</span>
                            </p>
                        </div>
                    </TabsContent>

                    {/* Tab: Location */}
                    <TabsContent value="location" className="space-y-4">
                        <div className="alert bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4 flex items-start gap-2">
                            <Map className="h-4 w-4 mt-0.5" />
                            <div>
                                <p className="font-semibold">Location Details</p>
                                <p>Provide accurate coordinates to help customers find you on Google Maps.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Overview Address (One line)</Label>
                            <Input
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                placeholder="e.g. Jakarta Selatan"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Detailed Address</Label>
                            <Textarea
                                value={form.detailAddress}
                                onChange={e => setForm({ ...form, detailAddress: e.target.value })}
                                placeholder="Full street address, building number, floor..."
                                className="h-24"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Latitude</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={form.latitude}
                                    onChange={e => setForm({ ...form, latitude: e.target.value })}
                                    placeholder="-6.2088"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Longitude</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={form.longitude}
                                    onChange={e => setForm({ ...form, longitude: e.target.value })}
                                    placeholder="106.8456"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Google Maps URL (Optional)</Label>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-gray-500" />
                                <Input
                                    value={form.googleMapsUrl}
                                    onChange={e => setForm({ ...form, googleMapsUrl: e.target.value })}
                                    placeholder="https://maps.app.goo.gl/..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="outline" type="button" onClick={() => window.open('https://www.google.com/maps', '_blank')}>
                                Open Google Maps to Find Coordinates
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Tab: Branding */}
                    <TabsContent value="branding" className="space-y-4">
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
                                    <SelectItem value="modern-emerald">Modern Emerald</SelectItem>
                                    <SelectItem value="classic-orange">Classic Orange</SelectItem>
                                    <SelectItem value="minimal-blue">Minimal Blue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Logo</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="w-full"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return

                                        const formData = new FormData()
                                        formData.append('file', file)

                                        try {
                                            const res = await fetch('/api/upload', {
                                                method: 'POST',
                                                body: formData
                                            })
                                            const data = await res.json()
                                            if (data.success) {
                                                setForm({ ...form, logo: data.url })
                                            } else {
                                                toast({ title: 'Error', description: 'Logo upload failed', variant: 'destructive' })
                                            }
                                        } catch (error) {
                                            toast({ title: 'Error', description: 'Logo upload failed', variant: 'destructive' })
                                        }
                                    }}
                                />
                                {form.logo && (
                                    <div className="relative w-16 h-16 border rounded overflow-hidden shrink-0">
                                        <Image src={form.logo} alt="Logo" fill className="object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Banner Image</Label>
                            <div className="border border-dashed p-4 rounded-lg text-center">
                                {form.banner ? (
                                    <div className="relative w-full h-32 rounded overflow-hidden group">
                                        <Image src={form.banner} alt="Banner" fill className="object-cover" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => setForm({ ...form, banner: '' })}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="py-4 text-gray-400">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                        <span className="text-sm">No Banner Uploaded</span>
                                    </div>
                                )}
                                <div className="mt-2 text-left">
                                    <Label htmlFor="banner-upload" className="cursor-pointer text-emerald-600 hover:underline">Upload Banner</Label>
                                    <Input
                                        id="banner-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return

                                            const formData = new FormData()
                                            formData.append('file', file)

                                            try {
                                                const res = await fetch('/api/upload', {
                                                    method: 'POST',
                                                    body: formData
                                                })
                                                const data = await res.json()
                                                if (data.success) {
                                                    setForm({ ...form, banner: data.url })
                                                } else {
                                                    toast({ title: 'Error', description: 'Banner upload failed', variant: 'destructive' })
                                                }
                                            } catch (error) {
                                                toast({ title: 'Error', description: 'Banner upload failed', variant: 'destructive' })
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="mt-6 flex justify-end pt-4 border-t">
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px]">
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
