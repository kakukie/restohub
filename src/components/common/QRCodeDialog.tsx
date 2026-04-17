'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Download } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app-store'
import { useTranslation } from '@/lib/i18n'

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantSlug: string
  restaurantName: string
}

export default function QRCodeDialog({ open, onOpenChange, restaurantSlug, restaurantName }: QRCodeDialogProps) {
  const { language } = useAppStore()
  const t = useTranslation(language as 'en' | 'id')

  // Use slug for the URL (properly formatted for sharing)
  const [tableNumber, setTableNumber] = useState('')
  
  // Use slug for the URL (properly formatted for sharing)
  const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${encodeURIComponent(restaurantSlug)}${tableNumber ? `?table=${tableNumber}` : ''}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl)
    toast({ title: t('copied'), description: t('menuLinkCopied') })
  }

  const handleDownloadQR = () => {
    // Simple QR code generation using Google Charts API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}`
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qr-${restaurantName}${tableNumber ? `-table-${tableNumber}` : ''}.png`
    link.click()
    toast({ title: t('downloaded'), description: t('qrDownloaded') })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('qrCodeMenu')}</DialogTitle>
          <DialogDescription>
            {t('shareQrCodeDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Table Number Input */}
          <div className="w-full space-y-2 px-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Nomor Meja (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: 01, 12, A1..."
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[10px] text-gray-400">Scan QR ini akan otomatis mengisi nomor meja di halaman checkout.</p>
          </div>

          {/* QR Code Image */}
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`}
              alt="QR Code"
              className="w-64 h-64"
            />
          </div>

          {/* Menu URL */}
          <div className="w-full">
            <div className="text-sm font-medium mb-2">{t('menuUrl')}</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={menuUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-gray-50"
              />
              <Button size="sm" variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button onClick={handleDownloadQR} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {t('downloadQr')}
            </Button>
            <Button variant="outline" onClick={() => window.open(menuUrl, '_blank')} className="flex-1">
              {t('previewMenu')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
