import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, AlertCircle, RefreshCcw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ReturnModalProps {
  order: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function ReturnModal({ order, open, onOpenChange, onSuccess }: ReturnModalProps) {
  const [returnItems, setReturnItems] = useState<any[]>(
    order?.items.map((item: any) => ({
      orderItemId: item.id,
      name: item.menuItemName,
      maxQuantity: item.quantity,
      quantity: 0,
      disposition: 'GOOD'
    })) || []
  )
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter(i => i.quantity > 0)
    if (itemsToReturn.length === 0) {
      return toast({ title: 'Error', description: 'Pilih minimal 1 item untuk diretur', variant: 'destructive' })
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToReturn, reason })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Berhasil', description: 'Retur berhasil diproses' })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({ title: 'Error', description: data.error || 'Gagal proses retur', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Gagal proses retur', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-orange-500" />
            Proses Retur Order #{order?.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Pilih item yang akan dikembalikan dan kondisinya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <ScrollArea className="h-[300px] pr-4 border rounded-lg p-2">
            <div className="space-y-3">
              {returnItems.map((item, idx) => (
                <div key={item.orderItemId} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Maks: {item.maxQuantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      min={0}
                      max={item.maxQuantity}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Math.min(item.maxQuantity, Math.max(0, parseInt(e.target.value) || 0))
                        const newItems = [...returnItems]
                        newItems[idx].quantity = val
                        setReturnItems(newItems)
                      }}
                    />
                    <Select
                      value={item.disposition}
                      onValueChange={(v) => {
                        const newItems = [...returnItems]
                        newItems[idx].disposition = v
                        setReturnItems(newItems)
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GOOD">Kembali Stok</SelectItem>
                        <SelectItem value="DAMAGED">Rusak/Buang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="space-y-2">
            <Label>Alasan Retur</Label>
            <Input 
              placeholder="Contoh: Salah order, makanan dingin, barang cacat..." 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button 
            disabled={submitting} 
            onClick={handleSubmit}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {submitting ? 'Memproses...' : 'Proses Retur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
