'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Download } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantSlug: string
  restaurantName: string
}

export default function QRCodeDialog({ open, onOpenChange, restaurantSlug, restaurantName }: QRCodeDialogProps) {
  // Use slug for the URL (properly formatted for sharing)
  const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/menu/${restaurantSlug}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl)
    toast({ title: 'Copied!', description: 'Menu link copied to clipboard' })
  }

  const handleDownloadQR = () => {
    // Simple QR code generation using Google Charts API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}`
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qr-${restaurantName}.png`
    link.click()
    toast({ title: 'Downloaded!', description: 'QR code downloaded successfully' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code Menu</DialogTitle>
          <DialogDescription>
            Share this QR code with your customers to view the menu
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
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
            <div className="text-sm font-medium mb-2">Menu URL:</div>
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
              Download QR
            </Button>
            <Button variant="outline" onClick={() => window.open(menuUrl, '_blank')} className="flex-1">
              Preview Menu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
