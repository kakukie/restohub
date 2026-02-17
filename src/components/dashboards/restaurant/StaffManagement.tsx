'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit, Shield, User as UserIcon, Mail, Phone, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { User } from '@/store/app-store'

interface StaffManagementProps {
    restaurantId: string
    maxStaff?: number
}

export default function StaffManagement({ restaurantId, maxStaff = 5 }: StaffManagementProps) {
    const [staff, setStaff] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<User | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'STAFF' // 'RESTAURANT_ADMIN' or 'STAFF' (assuming STAFF role exists or simplified to admin with permissions)
    })

    const fetchStaff = useCallback(async () => {
        if (!restaurantId) return
        setLoading(true)
        try {
            // Fetch restaurant staff (RESTAURANT_ADMIN) and customers who ordered
            const res = await fetch(`/api/users?restaurantId=${restaurantId}`)
            const data = await res.json()
            if (data.success) {
                setStaff(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch staff', error)
            toast({ title: 'Error', description: 'Failed to load staff members', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [restaurantId])

    useEffect(() => {
        fetchStaff()
    }, [fetchStaff])

    const handleOpenDialog = (staffMember?: User) => {
        if (staffMember) {
            setEditingStaff(staffMember)
            setFormData({
                name: staffMember.name,
                email: staffMember.email,
                phone: staffMember.phone || '',
                password: '', // Don't fill password for edit
                role: 'RESTAURANT_ADMIN' // Default or derive from user data
            })
        } else {
            setEditingStaff(null)
            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                role: 'RESTAURANT_ADMIN'
            })
        }
        setDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) {
            return toast({ title: 'Error', description: 'Name and Email are required', variant: 'destructive' })
        }

        if (!editingStaff && !formData.password) {
            return toast({ title: 'Error', description: 'Password is required for new accounts', variant: 'destructive' })
        }

        // Check limit
        if (!editingStaff && maxStaff > 0 && staff.length >= maxStaff) {
            return toast({ title: 'Limit Reached', description: `You cannot add more than ${maxStaff} staff members.`, variant: 'destructive' })
        }

        try {
            const url = editingStaff ? `/api/users/${editingStaff.id}` : '/api/users'
            const method = editingStaff ? 'PUT' : 'POST'

            const body = {
                ...formData,
                restaurantId,
                role: 'RESTAURANT_ADMIN' // For now default to admin role for restaurant staff, or adjust if you have a specific STAFF role
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const data = await res.json()

            if (res.ok) {
                toast({ title: 'Success', description: `Staff member ${editingStaff ? 'updated' : 'added'} successfully` })
                setDialogOpen(false)
                fetchStaff()
            } else {
                toast({ title: 'Error', description: data.message || 'Operation failed', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this staff member?')) return

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast({ title: 'Success', description: 'Staff member removed' })
                fetchStaff()
            } else {
                toast({ title: 'Error', description: 'Failed to remove staff', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to remove staff', variant: 'destructive' })
        }
    }

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Management</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Manage your restaurant team members.
                        <span className={staff.length >= maxStaff ? "text-red-500 font-bold ml-1" : "text-emerald-600 font-medium ml-1"}>
                            ({staff.length} / {maxStaff === 0 ? 'Unlimited' : maxStaff} used)
                        </span>
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search staff..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => handleOpenDialog()}
                        disabled={maxStaff !== 0 && staff.length >= maxStaff}
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading staff...</div>
            ) : filteredStaff.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border rounded-xl border-dashed">
                    <p>No staff members found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map((member) => (
                        <Card key={member.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <UserIcon className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{member.name}</CardTitle>
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                {member.role.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(member)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2 pt-2">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <Mail className="h-4 w-4" />
                                    <span>{member.email}</span>
                                </div>
                                {member.phone && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <Phone className="h-4 w-4" />
                                        <span>{member.phone}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</DialogTitle>
                        <DialogDescription>
                            {editingStaff ? 'Update staff details.' : 'Create a new account for your staff member.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone (Optional)</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+62..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{editingStaff ? 'New Password (leave blank to keep)' : 'Password'}</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">Save Staff</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
