import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Minus, History, AlertTriangle, Calendar, Package } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface StockMovement {
  id: string
  menuItem: { name: string }
  type: string
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  createdAt: string
}

interface StockManagementProps {
  restaurantId: string
  menuItems: any[]
  onUpdate: () => void
}

export default function StockManagement({ restaurantId, menuItems, onUpdate }: StockManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [adjustForm, setAdjustForm] = useState({
    type: 'STOCK_IN',
    quantity: 0,
    reason: '',
    expiryDate: ''
  })
  const [loadingMovements, setLoadingMovements] = useState(false)

  const fetchMovements = async () => {
    setLoadingMovements(true)
    try {
      const res = await fetch(`/api/stock/adjust?restaurantId=${restaurantId}`)
      const data = await res.json()
      if (data.success) setMovements(data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMovements(false)
    }
  }

  useEffect(() => {
    fetchMovements()
  }, [restaurantId])

  const handleAdjust = async () => {
    if (!selectedItem || adjustForm.quantity <= 0) return

    try {
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: selectedItem.id,
          ...adjustForm
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Berhasil', description: 'Stok berhasil diperbarui' })
        setShowAdjustModal(false)
        setAdjustForm({ type: 'STOCK_IN', quantity: 0, reason: '', expiryDate: '' })
        fetchMovements()
        onUpdate()
      }
    } catch (e) {
      toast({ title: 'Gagal', description: 'Gagal memperbarui stok', variant: 'destructive' })
    }
  }

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Stok</h2>
          <p className="text-muted-foreground">Kelola persediaan bahan dan produk secara akurat.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari menu..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Daftar Inventaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Package className="h-6 w-6 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={item.stock <= (item.lowStockThreshold || 5) ? "destructive" : "secondary"}>
                            Stok: {item.stock}
                          </Badge>
                          {item.expiryDate && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Exp: {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => {
                        setSelectedItem(item)
                        setShowAdjustModal(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Sesuaikan
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-blue-500" />
              Aktivitas Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {movements.map((move) => (
                  <div key={move.id} className="text-sm p-3 rounded-lg bg-muted/30 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold">{move.menuItem?.name}</span>
                      <span className={move.type.includes('IN') || move.type.includes('GOOD') ? "text-emerald-500 font-black" : "text-red-500 font-black"}>
                        {move.type.includes('IN') || move.type.includes('GOOD') ? '+' : '-'}{move.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-1">"{move.reason || move.type}"</p>
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                      <span>{new Date(move.createdAt).toLocaleTimeString()}</span>
                      <span>Sisa: {move.newStock}</span>
                    </div>
                  </div>
                ))}
                {movements.length === 0 && <p className="text-center py-10 text-muted-foreground">Belum ada riwayat mutasi.</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Penyesuaian Stok: {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tipe</Label>
              <Select 
                value={adjustForm.type} 
                onValueChange={(v) => setAdjustForm(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STOCK_IN">Stok Masuk (+)</SelectItem>
                  <SelectItem value="WASTE">Barang Rusak / Waste (-)</SelectItem>
                  <SelectItem value="CORRECTION">Koreksi Manual (=)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Jumlah</Label>
              <Input
                type="number"
                className="col-span-3"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Kadaluarsa</Label>
              <Input
                type="date"
                className="col-span-3"
                value={adjustForm.expiryDate}
                onChange={(e) => setAdjustForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Alasan</Label>
              <Input
                className="col-span-3"
                placeholder="Contoh: Belanja Mingguan, Barang Expired..."
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustModal(false)}>Batal</Button>
            <Button onClick={handleAdjust}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
