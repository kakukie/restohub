'use client'

import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from '@/hooks/use-toast'

interface PaymentMethodDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: any
    restaurantId: string
    onSuccess: () => void
}

export default function PaymentMethodDialog({
    open,
    onOpenChange,
    initialData,
    restaurantId,
    onSuccess
}: PaymentMethodDialogProps) {
    const isEditing = !!initialData?.id
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        type: 'QRIS',
        isActive: true,
        accountName: '',
        accountNumber: ''
    })

    useEffect(() => {
        if (open) {
            if (initialData?.id) {
                setFormData({
                    type: initialData.type || 'QRIS',
                    isActive: initialData.isActive ?? true,
                    accountName: initialData.accountName || '',
                    accountNumber: initialData.accountNumber || ''
                })
            } else {
                // Reset for new entry
                setFormData({
                    type: 'QRIS',
                    isActive: true,
                    accountName: '',
                    accountNumber: ''
                })
            }
        }
    }, [open, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = isEditing
                ? `/api/payment-methods/${initialData.id}`
                : '/api/payment-methods'

            const method = isEditing ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    restaurantId
                })
            })

            const data = await res.json()

            if (data.success) {
                toast({
                    title: "Success",
                    description: `Payment method ${isEditing ? 'updated' : 'added'} successfully`
                })
                onSuccess()
                onOpenChange(false)
            } else {
                throw new Error(data.error || 'Failed to save')
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "Error",
                description: "Failed to save payment method",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Payment Method' : 'Add Payment Method'}</DialogTitle>
                    <DialogDescription>
                        Configure payment options for your customers.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Payment Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                            disabled={isEditing} // Often type shouldn't change after creation to keep history consistent, or allow it
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="QRIS">QRIS</SelectItem>
                                <SelectItem value="OVO">OVO</SelectItem>
                                <SelectItem value="GOPAY">GoPay</SelectItem>
                                <SelectItem value="DANA">DANA</SelectItem>
                                <SelectItem value="SHOPEEPAY">ShopeePay</SelectItem>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountName">Account Name (Optional)</Label>
                        <Input
                            id="accountName"
                            value={formData.accountName}
                            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                            placeholder="e.g. PT Resto Enak"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number / ID (Optional)</Label>
                        <Input
                            id="accountNumber"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            placeholder="e.g. 08123456789 or 123-456-789"
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg">
                        <Label htmlFor="isActive" className="flex flex-col space-y-1">
                            <span>Active Status</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Enable this payment method for customers
                            </span>
                        </Label>
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
