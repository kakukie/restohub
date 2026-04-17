'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useAppStore, MenuItem, Category, PaymentMethod, Order } from '@/store/app-store'
import { toast } from '@/hooks/use-toast'
import QRCodeDialog from '@/components/common/QRCodeDialog'
import { useTranslation } from '@/lib/i18n'

// New Components
import Sidebar from './restaurant/Sidebar'
import Header from './restaurant/Header'
import StatsGrid from './restaurant/StatsGrid'
import RecentOrders from './restaurant/RecentOrders'
import PaymentMethods from './restaurant/PaymentMethods'
import PaymentMethodDialog from './restaurant/PaymentMethodDialog' // Imported
import StaffManagement from './restaurant/StaffManagement'
import BestSellers from './restaurant/BestSellers'
import HelpdeskChat from './HelpdeskChat'

// Legacy / Existing Sub-Components (We will reuse these or refactor later)
// For now, we reuse the logic and render them conditionally
import RestaurantSettingsForm from './forms/RestaurantSettingsForm'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs' // Might still need for sub-tabs
import { Plus, Minus, Search, Trash2, Edit2, Camera, Bell, CheckCircle2, XCircle, FileText, ChevronDown, ChevronUp, Clock, FileDown, Eye, Filter, Loader2, Printer, Grid, List, Check, X, Edit, RefreshCw, Download, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CapacitorBluetoothPrinterService, printerService } from '@/lib/bluetooth-printer'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'

// ... (Import other necessary UI components like in Old file)

// At the top of the file or in a separate definitions file
declare global {
    interface Window {
        Android?: {
            /** New bridge: accepts callbackId for async response */
            printReceipt: (orderData: string, restaurantData: string, callbackId?: string) => void;
            /** Returns JSON string: {available, printerName?, reason?} */
            checkPrinterAvailable: () => string;
        };
        __printerCallback?: (callbackId: string, success: boolean, message: string) => void;
        __printerCallbacks?: Record<string, (success: boolean, message: string) => void>;
    }
}

interface RestaurantAdminDashboardProps {
}

export default function RestaurantAdminDashboard() {
    const {
        user,
        logout,
        restaurants,
        setRestaurants,
        orders,
        setOrders,
        helpdeskSettings,
        language,
        setLanguage
    } = useAppStore()

    const t = useTranslation(language as 'en' | 'id')

    // --- STATE MANAGEMENT (Copied from Old) ---
    const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'orders' | 'menu' | 'settings' | 'categories' | 'analytics'
    const prevPendingCount = useRef<number>(0)
    const [categories, setCategories] = useState<Category[]>([])
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [myBranches, setMyBranches] = useState<any[]>([])

    // Dialog States
    const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false)
    const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false)
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [viewOrder, setViewOrder] = useState<Order | null>(null)

    // Forms & Editing
    const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
    const [menuItemForm, setMenuItemForm] = useState<Partial<MenuItem>>({})
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [categoryForm, setCategoryForm] = useState<Partial<Category>>({})

    // Payment Method States
    const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false)
    const [paymentMethodForm, setPaymentMethodForm] = useState<Partial<PaymentMethod>>({})

    // Order Validation States
    const [validateOrderId, setValidateOrderId] = useState<string | null>(null)
    const [manualEmail, setManualEmail] = useState('')
    const [manualPhone, setManualPhone] = useState('')

    // Menu Management States
    const [menuSearchQuery, setMenuSearchQuery] = useState('')
    const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('ALL')
    const [menuViewMode, setMenuViewMode] = useState<'grid' | 'table'>('grid')
    const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([])

    // Orders Management States
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL')
    const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('ALL') // NEW: payment method filter
    const [orderDateRange, setOrderDateRange] = useState({ start: '', end: '' })
    const [orderSearchQuery, setOrderSearchQuery] = useState('')
    const [orderCurrentPage, setOrderCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

    // Manual Order (Admin Note Feature)
    const [manualOrderDialogOpen, setManualOrderDialogOpen] = useState(false)
    const [manualOrderForm, setManualOrderForm] = useState<{
        customerName: string
        orderSource: string
        adminNotes: string
        tableNumber: string
        paymentMethod: string
        items: { menuItemId: string; quantity: number }[]
    }>({
        customerName: '',
        orderSource: 'GRABFOOD',
        adminNotes: '',
        tableNumber: '',
        paymentMethod: 'CASH',
        items: []
    })
    const [submittingManualOrder, setSubmittingManualOrder] = useState(false)

    // Reports & Analytics States
    const [reportGranularity, setReportGranularity] = useState<'day' | 'month' | 'year'>('day')
    const [reportDateRange, setReportDateRange] = useState({ start: '', end: '' })
    const [loadingReports, setLoadingReports] = useState(false)
    // reportStats mirrors the nested API response: { stats: {...}, topMenuItems, topPaymentMethods, chartData }
    const [reportStats, setReportStats] = useState<any>({
        stats: {
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            completedOrders: 0,
            cancelledOrders: 0,
            trends: { orders: 0, revenue: 0, cancelled: 0 }
        },
        topMenuItems: [],
        topPaymentMethods: [],
        chartData: {}
    })

    const [restaurantId, setRestaurantId] = useState<string>('')
    const [currentRestaurant, setCurrentRestaurant] = useState<any>(null)
    const [loadingRestaurant, setLoadingRestaurant] = useState(true) // Add loading state
    const [isPrinting, setIsPrinting] = useState(false)
    const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm'>('58mm')
    const [printerAddress, setPrinterAddress] = useState<string>('')
    const [printerAutoPrint, setPrinterAutoPrint] = useState<boolean>(false)
    const [settingsError, setSettingsError] = useState<string>('')

    // --- DATA FETCHING (Copied from Old) ---
    // ... (Refer to Old file for loadRestaurantDetails, loadMenuData, loadOrderData)

    const loadRestaurantDetails = useCallback(async () => {
        if (!user?.restaurantId) {
            setLoadingRestaurant(false)
            return
        }
        setRestaurantId(user.restaurantId)
        setLoadingRestaurant(true)
        try {
            const res = await fetch(`/api/restaurants/${user.restaurantId}`)
            const data = await res.json()
            if (data.success) {
                setCurrentRestaurant(data.data)
                setCategories(data.data.categories || [])
                setMenuItems(data.data.menuItems || [])
                setPaymentMethods(data.data.paymentMethods || [])
                setMyBranches(data.data.branches || [])
                const ps = data.data.printerSettings || {}
                setPrinterPaperSize(ps.paperSize === '80mm' ? '80mm' : '58mm')
                setPrinterAddress(ps.bluetoothName || '')
                setPrinterAutoPrint(!!ps.autoPrint)
            } else {
                toast({ title: 'Error', description: 'Failed to load restaurant data', variant: 'destructive' })
            }
        } catch (error) {
            console.error("Failed to load details", error)
            toast({ title: 'Error', description: 'Failed to load restaurant data', variant: 'destructive' })
            setSettingsError('Failed to load restaurant data')
        } finally {
            setLoadingRestaurant(false)
        }
    }, [user?.restaurantId])

    const savePrinterSettings = async () => {
        if (!restaurantId) return
        const newSettings = {
            paperSize: printerPaperSize,
            bluetoothName: printerAddress,
            autoPrint: printerAutoPrint
        }
        try {
            await fetch(`/api/restaurants/${restaurantId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ printerSettings: newSettings })
            })
            toast({ title: t('success'), description: t('settingsUpdated') })
            setCurrentRestaurant((prev: any) => prev ? { ...prev, printerSettings: newSettings } : prev)
        } catch (error) {
            toast({ title: 'Error', description: t('updateFailed'), variant: 'destructive' })
        }
    }

    // Lightweight menu-only reload for faster saves
    const loadMenuItems = useCallback(async () => {
        if (!user?.restaurantId) return
        try {
            const res = await fetch(`/api/menu-items?restaurantId=${user.restaurantId}`)
            const data = await res.json()
            if (data.success) setMenuItems(data.data || [])
        } catch (error) {
            console.error("Failed to reload menu", error)
        }
    }, [user?.restaurantId])

    const loadOrderData = useCallback(async () => {
        if (!user?.restaurantId) return

        const params = new URLSearchParams({
            restaurantId: user.restaurantId
        })

        if (orderStatusFilter !== 'ALL') {
            params.append('status', orderStatusFilter)
        }

        if (orderPaymentFilter !== 'ALL') {
            params.append('paymentMethod', orderPaymentFilter)
        }

        if (orderDateRange.start) {
            params.append('startDate', orderDateRange.start)
        }

        if (orderDateRange.end) {
            params.append('endDate', orderDateRange.end)
        }

        try {
            const res = await fetch(`/api/orders?${params.toString()}`)
            const data = await res.json()
            if (data.success) {
                setOrders(data.data)
            }
        } catch (e) {
            console.error("Failed to load orders", e)
        }
    }, [user?.restaurantId, orderStatusFilter, orderPaymentFilter, orderDateRange, setOrders])

    const loadReportsData = useCallback(async () => {
        if (!user?.restaurantId) return
        setLoadingReports(true)

        const params = new URLSearchParams({
            restaurantId: user.restaurantId,
            granularity: reportGranularity
        })

        if (reportDateRange.start && reportDateRange.start !== '') params.append('startDate', reportDateRange.start)
        if (reportDateRange.end && reportDateRange.end !== '') params.append('endDate', reportDateRange.end)

        try {
            const res = await fetch(`/api/reports?${params.toString()}`)
            const data = await res.json()
            if (data.success) {
                setReportStats(data.data)
            }
        } catch (e) {
            console.error("Failed to load reports", e)
            toast({ title: "Error", description: "Failed to load report data", variant: "destructive" })
        } finally {
            setLoadingReports(false)
        }
    }, [user?.restaurantId, reportGranularity, reportDateRange])

    // --- AUTO-REFRESH ORDERS & REPORTS ---
    useEffect(() => {
        // Only pool if user is on the dashboard (don't drain if not logged in)
        if (!user?.restaurantId) return;

        // Initial load
        loadOrderData()
        loadReportsData()

        // Background polling every 15 seconds
        const intervalId = setInterval(() => {
            loadOrderData()
            loadReportsData()
        }, 15000)

        return () => clearInterval(intervalId)
    }, [loadOrderData, loadReportsData, user?.restaurantId])

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingOrderId(orderId)
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: newStatus }) // Changed from 'id' to 'orderId'
            })
            const data = await res.json()
            if (data.success) {
                toast({ title: "Success", description: `Order ${newStatus.toLowerCase()}` })
                loadOrderData()
            } else {
                toast({ title: "Error", description: data.error || "Failed to update order", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update order", variant: "destructive" })
        } finally {
            setUpdatingOrderId(null)
        }
    }

    // ΓöÇΓöÇ Manual Order Handler ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const handleCreateManualOrder = async () => {
        if (!manualOrderForm.customerName) {
            return toast({ title: 'Error', description: 'Nama customer wajib diisi', variant: 'destructive' })
        }
        if (manualOrderForm.items.length === 0) {
            return toast({ title: 'Error', description: 'Pilih minimal 1 menu item', variant: 'destructive' })
        }

        setSubmittingManualOrder(true)
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId: user?.restaurantId,
                    customerName: manualOrderForm.customerName,
                    tableNumber: manualOrderForm.tableNumber || 'ONLINE',
                    notes: `[${manualOrderForm.orderSource}] ${manualOrderForm.adminNotes}`,
                    paymentMethod: manualOrderForm.paymentMethod || 'CASH',
                    orderSource: manualOrderForm.orderSource,
                    adminNotes: manualOrderForm.adminNotes,
                    items: manualOrderForm.items.filter(i => i.quantity > 0).map(i => ({
                        menuItemId: i.menuItemId,
                        quantity: i.quantity,
                        price: 0,
                        notes: ''
                    }))
                })
            })
            const data = await res.json()
            if (data.success) {
                toast({ title: 'Berhasil', description: `Order ${manualOrderForm.orderSource} berhasil dicatat!` })
                setManualOrderDialogOpen(false)
                setManualOrderForm({
                    customerName: '',
                    orderSource: 'GRABFOOD',
                    adminNotes: '',
                    tableNumber: '',
                    paymentMethod: 'CASH',
                    items: []
                })
                loadOrderData()
            } else {
                toast({ title: 'Error', description: data.error || 'Gagal membuat order', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Gagal membuat order manual', variant: 'destructive' })
        } finally {
            setSubmittingManualOrder(false)
        }
    }

    // --- HELPER FUNCTIONS ---
    const getSoldCount = useCallback((menuItemId: string) => {
        return orders
            .filter(o => o.status === 'COMPLETED')
            .reduce((total, order) => {
                const itemQtys = order.items
                    .filter(i => i.menuItemId === menuItemId)
                    .reduce((sum, i) => sum + i.quantity, 0)
                return total + itemQtys
            }, 0)
    }, [orders])

    // --- AUDIO NOTIFICATION ---
    useEffect(() => {
        const pendingCount = orders.filter(o => o.status === 'PENDING').length;
        if (pendingCount > prevPendingCount.current) {
            // Play alarm beep notification
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'square'; // harsher alarm sound
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                // Pulse 3 times rapidly
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.6);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
            } catch (e) {
                console.error("Audio play failed:", e);
            }
        }
        prevPendingCount.current = pendingCount;
    }, [orders])

    // --- HANDLERS ---

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
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
                callback(data.url)
            } else {
                toast({ title: "Error", description: "Image upload failed", variant: "destructive" })
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast({ title: "Error", description: "Image upload failed", variant: "destructive" })
        }
    }



    const handlePrintOrder = async (order: any) => {
        if (isPrinting) return;
        setIsPrinting(true);
        const resetPrinting = () => setTimeout(() => setIsPrinting(false), 2000);

        try {
            toast({ title: "Inisiasi Printer", description: "Mencari printer Bluetooth..." });

            const orderData = {
                id: order.id,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                customerName: order.customerName || 'Guest',
                tableNumber: order.tableNumber || '',
                items: order.items.map((item: any) => ({
                    menuItemName: item.menuItemName || item.name || '-',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    notes: item.notes || ''
                })),
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod || '-'
            };

            const restaurantData = {
                name: currentRestaurant?.name || 'Restaurant',
                address: currentRestaurant?.address || '',
                phone: currentRestaurant?.phone || ''
            };

            // === Path 1: Native Android bridge (PrinterBridge.java via WebView) ===
            if (window.Android && window.Android.printReceipt) {
                toast({ title: "Mencetak", description: "Mengirim struk ke printer kasir..." });

                // Setup callback registry if not yet done
                if (!window.__printerCallbacks) window.__printerCallbacks = {};
                if (!window.__printerCallback) {
                    window.__printerCallback = (cbId: string, success: boolean, message: string) => {
                        const fn = window.__printerCallbacks?.[cbId];
                        if (fn) {
                            fn(success, message);
                            delete window.__printerCallbacks![cbId];
                        }
                    };
                }

                const cbId = 'cb_print_' + Date.now();
                await new Promise<void>((resolve) => {
                    window.__printerCallbacks![cbId] = (success: boolean, message: string) => {
                        resetPrinting();
                        if (success) {
                            toast({ title: "Cetak Berhasil", description: "Struk telah dikirim ke printer." });
                        } else {
                            // Check for common error types to give better UX
                            let title = "Gagal Cetak";
                            let desc = message;
                            
                            if (message.includes("Izin Bluetooth ditolak")) {
                                title = "Izin Diperlukan";
                                desc = "Mohon berikan izin Bluetooth di Pengaturan HP Anda agar aplikasi bisa mendeteksi printer.";
                            } else if (message.includes("belum di-pair")) {
                                title = "Printer Tidak Ditemukan";
                                desc = "Pastikan printer menyala dan sudah di-'Pair' melalui Pengaturan Bluetooth Android.";
                            } else if (message.includes("Nyalakan Bluetooth")) {
                                title = "Bluetooth Mati";
                                desc = "Harap aktifkan Bluetooth di HP Anda.";
                            }
                            
                            toast({ title, description: desc, variant: "destructive" });
                        }
                        resolve();
                    };

                    // Timeout 15s
                    setTimeout(() => {
                        if (window.__printerCallbacks?.[cbId]) {
                            delete window.__printerCallbacks![cbId];
                            resetPrinting();
                            toast({ title: "Timeout", description: "Printer tidak merespons dalam 15 detik.", variant: "destructive" });
                            resolve();
                        }
                    }, 15000);

                    try {
                        window.Android!.printReceipt(JSON.stringify(orderData), JSON.stringify(restaurantData), cbId);
                    } catch {
                        // Fallback: old bridge without callbackId (silent)
                        window.Android!.printReceipt(JSON.stringify(orderData), JSON.stringify(restaurantData));
                        resetPrinting();
                        setTimeout(() => resolve(), 2000);
                    }
                });
                return;
            }

            // === Path 2: Capacitor BLE / Web Bluetooth ===
            try {
                toast({ title: "Koneksi Printer", description: "Mencari dan menghubungkan ke printer BLE..." });
                const savedName = currentRestaurant?.printerSettings?.bluetoothName || printerAddress || '';

                if (!printerService.isConnected) {
                    await printerService.autoConnect(savedName || undefined);
                }

                toast({ title: "Mencetak", description: "Mengirim struk ke printer..." });
                await printerService.printReceipt(orderData, restaurantData);
                toast({ title: "Sukses", description: "Struk berhasil dicetak!" });
                resetPrinting();
                return;
            } catch (bleErr: any) {
                console.warn("BLE print failed, falling back to PDF:", bleErr.message);
            }
            
            // 3) Fallback: Browser print dialog / PDF
            const printWindow = window.open('', '_blank')
            if (printWindow) {
                const logoHtml = currentRestaurant?.logoUrl
                    ? `<div style=\"text-align: center; margin-bottom: 10px;\"><img src=\"${currentRestaurant.logoUrl}\" style=\"max-height: 50px; border-radius: 8px;\" /></div>`
                    : '';

                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Order #${order.orderNumber}</title>
                        <style>
                            @page {
                                size: 58mm auto; /* Fallback for many mobile printers */
                                margin: 0;
                            }
                            @media print {
                                body { margin: 0; padding: 5mm; }
                                .no-print { display: none; }
                                @page { margin: 0; }
                            }
                            body { 
                                font-family: 'Courier New', Courier, monospace; 
                                line-height: 1.2;
                                font-size: 12px;
                                width: 58mm; /* Default to 58mm width */
                                margin: 0 auto;
                                color: #000;
                            }
                            .header { text-align: center; margin-bottom: 10px; }
                            .logo { max-height: 40px; margin-bottom: 5px; }
                            .center { text-align: center; }
                            .dashed-line { border-top: 1px dashed #000; margin: 8px 0; }
                            .item { display: flex; justify-content: space-between; margin: 2px 0; }
                            .item-name { flex: 1; padding-right: 5px; }
                            .item-price { white-space: nowrap; }
                            .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px; }
                            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
                        </style>
                    </head>
                    <body>
                        <div class=\"header\">
                            ${logoHtml}
                            <div style=\"font-weight: bold; font-size: 16px;\">${currentRestaurant?.name || 'Restaurant'}</div>
                            <div>${currentRestaurant?.address || ''}</div>
                            <div>${currentRestaurant?.phone || ''}</div>
                        </div>

                        <div class=\"dashed-line\"></div>
                        
                        <div><strong>No: #${order.orderNumber}</strong></div>
                        <div>Tgl: ${new Date(order.createdAt).toLocaleString('id-ID')}</div>
                        <div>Cust: ${order.customerName || 'Guest'}</div>
                        <div>Tipe: ${order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway'}</div>

                        <div class="dashed-line"></div>

                        ${order.items.map((item: any) => `
                            <div class="item">
                                <span class="item-name">${item.quantity}x ${item.menuItemName}</span>
                                <span class="item-price">Rp${(item.price * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                            ${item.notes ? `<div style="font-size: 10px; font-style: italic; margin-left: 10px;">- ${item.notes}</div>` : ''}
                        `).join('')}

                        <div class="dashed-line"></div>

                        <div class="total">
                            <span>TOTAL</span>
                            <span>Rp${order.totalAmount.toLocaleString('id-ID')}</span>
                        </div>

                        <div class="dashed-line"></div>
                        
                        <div class="footer">
                            <p>Terima kasih atas kunjungan Anda!</p>
                            <p>Layanan Menu Digital oleh Meenuin</p>
                        </div>
                    </body>
                    </html>
                `)
                printWindow.document.close()
                setTimeout(() => { printWindow.print() }, 200) // Small delay for logo load
            }
        } catch (error: any) {
             console.error("Print feature error", error);
             toast({ title: "Gagal Cetak", description: error.message || "Pastikan Bluetooth On dan Support Thermal", variant: "destructive" });
        } finally {
             resetPrinting();
        }
    }

    const handleValidateOrder = async () => {
        if (!validateOrderId) return
        try {
            const res = await fetch(`/api/orders/${validateOrderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'CONFIRMED',
                    manualEmail: manualEmail || undefined,
                    manualPhone: manualPhone || undefined
                })
            })
            if (res.ok) {
                toast({ title: "Success", description: "Order confirmed" })
                setValidateOrderId(null)
                setManualEmail('')
                setManualPhone('')
                loadOrderData()
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to confirm order", variant: "destructive" })
        }
    }

    const handleSaveCategory = async () => {
        if (!categoryForm.name) {
            return toast({ title: "Error", description: "Category name is required", variant: "destructive" })
        }

        // Check limit
        if (!editingCategory && categories.length >= (currentRestaurant?.maxCategories || 0) && currentRestaurant?.maxCategories !== 0) {
            return toast({ title: "Error", description: `Category limit reached (${currentRestaurant?.maxCategories} categories)`, variant: "destructive" })
        }

        try {
            const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
            const method = editingCategory ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...categoryForm,
                    restaurantId: user?.restaurantId
                })
            })

            if (res.ok) {
                toast({ title: "Success", description: "Category saved" })
                setCategoryDialogOpen(false)
                setEditingCategory(null)
                setCategoryForm({})
                loadRestaurantDetails()
            } else {
                const error = await res.json()
                toast({ title: "Error", description: error.message || "Failed to save category", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save category", variant: "destructive" })
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Delete this category? Menu items in this category will need to be reassigned.")) return
        try {
            const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' }) // Fixed: use query parameter
            if (res.ok) {
                loadRestaurantDetails()
                toast({ title: "Success", description: "Category deleted" })
            } else {
                const data = await res.json()
                toast({ title: "Error", description: data.error || "Failed to delete category", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete category", variant: "destructive" })
        }
    }

    const handleToggleMenuItem = async (id: string, isAvailable: boolean) => {
        // Optimistic UI update
        const originalItem = menuItems.find(m => m.id === id);
        if (originalItem) {
            setMenuItems(items => items.map(item => item.id === id ? { ...item, isAvailable } : item));
        }

        try {
            const res = await fetch(`/api/menu-items`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isAvailable })
            });

            if (!res.ok) {
                throw new Error("Failed to update status");
            }
            toast({ title: "Updated", description: `Menu item is now ${isAvailable ? 'available' : 'disabled'}` });
        } catch (error) {
            // Revert
            if (originalItem) {
                setMenuItems(items => items.map(item => item.id === id ? { ...item, isAvailable: originalItem.isAvailable } : item));
            }
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    }

    const handleExportReport = () => {
        const stats = reportStats?.stats
        if (!stats || stats.totalOrders === 0) {
            toast({ title: 'No Data', description: 'No analytics data to export', variant: 'destructive' })
            return
        }

        try {
            // Create CSV content
            let csv = 'Restaurant Analytics Report\n\n'
            csv += `Period: ${reportDateRange.start} to ${reportDateRange.end}\n`
            csv += `Granularity: ${reportGranularity}\n\n`

            csv += 'Summary Statistics\n'
            csv += 'Metric,Value\n'
            csv += `Total Revenue,Rp ${stats.totalRevenue || 0}\n`
            csv += `Total Orders,${stats.totalOrders || 0}\n`
            csv += `Average Order Value,Rp ${stats.averageOrderValue || 0}\n`
            csv += `Completed Orders,${stats.completedOrders || 0}\n\n`

            if (reportStats.topMenuItems && reportStats.topMenuItems.length > 0) {
                csv += 'Top Menu Items\n'
                csv += 'Item Name,Orders,Revenue\n'
                reportStats.topMenuItems.forEach((item: any) => {
                    csv += `${item.name},${item.count},Rp ${item.revenue}\n`
                })
                csv += '\n'
            }

            if (reportStats.topPaymentMethods && reportStats.topPaymentMethods.length > 0) {
                csv += 'Top Payment Methods\n'
                csv += 'Payment Method,Transactions,Revenue\n'
                reportStats.topPaymentMethods.forEach((method: any) => {
                    csv += `${method.name},${method.count},Rp ${method.revenue}\n`
                })
            }

            // Download CSV
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast({ title: 'Success', description: 'Report exported successfully' })
        } catch (error) {
            console.error('Export error:', error)
            toast({ title: 'Error', description: 'Failed to export report', variant: 'destructive' })
        }
    }

    useEffect(() => {
        loadRestaurantDetails()
        loadOrderData()
        loadReportsData()
    }, [loadRestaurantDetails, loadOrderData, loadReportsData])

    // --- RENDER FUNCTIONS ---
    const handleSavePaymentMethod = async () => {
        if (!paymentMethodForm.type) return toast({ title: "Error", description: "Method type is required", variant: "destructive" })
        try {
            const url = paymentMethodForm.id ? `/api/payment-methods/${paymentMethodForm.id}` : '/api/payment-methods'
            const method = paymentMethodForm.id ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...paymentMethodForm, restaurantId: user?.restaurantId })
            })
            if (res.ok) {
                toast({ title: "Success", description: "Payment method saved" })
                setPaymentMethodDialogOpen(false)
                loadRestaurantDetails() // Refresh
            } else {
                toast({ title: "Error", description: "Failed to save", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to save", variant: "destructive" })
        }
    }

    const handleDeletePaymentMethod = async (id: string) => {
        if (!confirm("Delete this payment method?")) return
        try {
            await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' })
            loadRestaurantDetails()
            toast({ title: "Success", description: "Deleted" })
        } catch (error) { }
    }

    const handleTogglePaymentMethod = async (id: string, isActive: boolean) => {
        try {
            await fetch(`/api/payment-methods/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            })
            loadRestaurantDetails()
        } catch (error) { }
    }

    // --- RENDER HELPERS ---
    const renderDashboardContent = () => (
        <>
            <StatsGrid stats={{
                totalOrders: reportStats?.stats?.totalOrders || 0,
                revenue: reportStats?.stats?.totalRevenue || 0,
                totalCategories: categories.length,
                cancelledOrders: reportStats?.stats?.cancelledOrders || 0,
                trends: reportStats?.stats?.trends
            }} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <RecentOrders
                        orders={orders}
                        onViewOrder={(order) => setViewOrder(order)}
                        onPrintOrder={handlePrintOrder}
                        onRefresh={loadOrderData}
                    />
                </div>
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('payments')}</h2>
                        <Button size="sm" onClick={() => { setPaymentMethodForm({}); setPaymentMethodDialogOpen(true) }} className="bg-emerald-500 hover:bg-emerald-600">
                            <Plus className="h-4 w-4 mr-2" /> {t('add')}
                        </Button>
                    </div>

                    <PaymentMethods
                        methods={paymentMethods}
                        onToggle={handleTogglePaymentMethod}
                        onEdit={(method) => {
                            setPaymentMethodForm(method)
                            setPaymentMethodDialogOpen(true)
                        }}
                        onDelete={(id) => handleDeletePaymentMethod(id)}
                    />
                    <BestSellers
                        items={menuItems
                            .filter(m => m.isBestSeller || m.isRecommended)
                            .map(m => ({
                                id: m.id,
                                name: m.name,
                                price: m.price,
                                imageUrl: m.image,
                                soldCount: getSoldCount(m.id)
                            }))}
                    />
                </div>

            </div>
        </>
    )


    // --- RENDER FUNCTIONS ---
    const handleSaveMenuItem = async () => {
        if (!menuItemForm.name || !menuItemForm.price || !menuItemForm.categoryId) {
            return toast({ title: "Validation Error", description: "Name, Price and Category are required", variant: "destructive" })
        }

        try {
            const isEdit = !!editingMenuItem || !!(menuItemForm as any).id
            const url = isEdit ? `/api/menu-items` : '/api/menu-items'
            const method = isEdit ? 'PUT' : 'POST'
            const body = isEdit
                ? { ...menuItemForm, id: editingMenuItem?.id || (menuItemForm as any).id, restaurantId: user?.restaurantId }
                : { ...menuItemForm, restaurantId: user?.restaurantId }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                toast({ title: "Success", description: `Menu item ${editingMenuItem ? 'updated' : 'added'} successfully` })
                setMenuItemDialogOpen(false)
                setEditingMenuItem(null)
                setMenuItemForm({})
                loadMenuItems()
            } else {
                const error = await res.json()
                toast({ title: "Error", description: error.error || "Failed to save menu item", variant: "destructive" })
            }
        } catch (error) {
            console.error("Save Menu Item Error", error)
            toast({ title: "Error", description: "Failed to save menu item", variant: "destructive" })
        }
    }

    const handleDeleteMenuItem = async (id: string) => {
        if (!confirm(t('deleteMenuItemConfirm'))) return
        try {
            const res = await fetch(`/api/menu-items?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast({ title: "Success", description: "Menu item deleted" })
                loadRestaurantDetails()
            } else {
                toast({ title: "Error", description: "Failed to delete item", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete item", variant: "destructive" })
        }
    }

    const renderMenuContent = () => {
        // Filter menu items based on search and category
        const filteredMenuItems = menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(menuSearchQuery.toLowerCase())
            const matchesCategory = menuCategoryFilter === 'ALL' || item.categoryId === menuCategoryFilter
            return matchesSearch && matchesCategory
        })

        const handleBulkDelete = async () => {
            if (!confirm(t('deleteSelectedItemsConfirm').replace('{count}', selectedMenuItems.length.toString()))) return
            try {
                await Promise.all(selectedMenuItems.map(id =>
                    fetch(`/api/menu-items?id=${id}`, { method: 'DELETE' }) // Fixed: use query parameter
                ))
                setSelectedMenuItems([])
                loadRestaurantDetails()
                toast({ title: "Success", description: `${selectedMenuItems.length} items deleted` })
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete items", variant: "destructive" })
            }
        }

        const handleBulkToggleAvailability = async (isAvailable: boolean) => {
            try {
                await Promise.all(selectedMenuItems.map(id =>
                    fetch(`/api/menu-items/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, isAvailable })
                    })
                ))
                setSelectedMenuItems([])
                loadRestaurantDetails()
                toast({ title: "Success", description: `${selectedMenuItems.length} items ${isAvailable ? 'enabled' : 'disabled'}` })
            } catch (error) {
                toast({ title: "Error", description: "Failed to update items", variant: "destructive" })
            }
        }

        const toggleSelectItem = (id: string) => {
            setSelectedMenuItems(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            )
        }

        const toggleSelectAll = () => {
            if (selectedMenuItems.length === filteredMenuItems.length) {
                setSelectedMenuItems([])
            } else {
                setSelectedMenuItems(filteredMenuItems.map(item => item.id))
            }
        }

        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* Header with Search and Filters */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('menuItems')}</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            <span className={(currentRestaurant?.maxMenuItems && menuItems.length >= currentRestaurant.maxMenuItems) ? 'text-red-500 font-bold' : 'text-emerald-600 font-medium'}>
                                {menuItems.length} / {currentRestaurant?.maxMenuItems === 0 || !currentRestaurant?.maxMenuItems ? 'Unlimited' : currentRestaurant.maxMenuItems} items
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMenuViewMode('grid')}
                            className={menuViewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : ''}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setMenuViewMode('table')}
                            className={menuViewMode === 'table' ? 'bg-emerald-50 text-emerald-600' : ''}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={t('searchItems')}
                            value={menuSearchQuery}
                            onChange={(e) => setMenuSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={menuCategoryFilter} onValueChange={setMenuCategoryFilter}>
                        <SelectTrigger className="w-full lg:w-48">
                            <SelectValue placeholder={t('allCategories')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t('allCategories')}</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Bulk Actions Toolbar */}
                {selectedMenuItems.length > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            {selectedMenuItems.length} {t('itemsSelected')}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkToggleAvailability(true)}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                {t('enable')}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkToggleAvailability(false)}
                            >
                                <X className="h-4 w-4 mr-1" />
                                {t('disable')}
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {t('delete')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Grid View */}
                {menuViewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMenuItems.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-slate-500">
                                <p>{t('noItemsFound')} {menuSearchQuery || menuCategoryFilter !== 'ALL' ? t('tryAdjustingFilters') : t('addFirstItem')}</p>
                            </div>
                        ) : (
                            filteredMenuItems.map(item => (
                                <Card key={item.id} className={`hover:shadow-lg transition-shadow ${selectedMenuItems.includes(item.id) ? 'ring-2 ring-emerald-500' : ''}`}>
                                    <CardHeader className="relative">
                                        <input
                                            type="checkbox"
                                            checked={selectedMenuItems.includes(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                            className="absolute top-4 left-4 h-4 w-4 rounded border-gray-300"
                                        />
                                        {item.image && (
                                            <div className="relative h-40 w-full rounded-lg overflow-hidden mb-3">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <CardTitle className="flex justify-between items-start">
                                            <span className="flex-1">{item.name}</span>
                                            <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                                                {item.isAvailable ? t('available') : t('unavailable')}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {item.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                                        )}
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-lg font-bold text-emerald-600">Rp {item.price.toLocaleString('id-ID')}</span>
                                            {item.stock !== null && item.stock !== undefined && (
                                                <span className="text-xs text-slate-500">Stock: {item.stock}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setEditingMenuItem(item)
                                                    setMenuItemForm(item)
                                                    setMenuItemDialogOpen(true)
                                                }}
                                            >
                                                <Edit className="h-3 w-3 mr-1" />
                                                {t('edit')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteMenuItem(item.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Table View */}
                {menuViewMode === 'table' && (
                    <div className="overflow-x-auto pb-4">
                        <table className="w-full min-w-[800px] lg:min-w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="p-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedMenuItems.length === filteredMenuItems.length && filteredMenuItems.length > 0}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="p-3 text-left text-sm font-semibold">{t('image')}</th>
                                    <th className="p-3 text-left text-sm font-semibold">{t('name')}</th>
                                    <th className="p-3 text-left text-sm font-semibold">{t('category')}</th>
                                    <th className="p-3 text-left text-sm font-semibold">{t('price')}</th>
                                    <th className="p-3 text-left text-sm font-semibold">{t('stock')}</th>
                                    <th className="p-3 text-left text-sm font-semibold">{t('status')}</th>
                                    <th className="p-3 text-left text-sm font-semibold">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMenuItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-500">
                                            {t('noItemsFound')} {menuSearchQuery || menuCategoryFilter !== 'ALL' ? t('tryAdjustingFilters') : t('addFirstItem')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMenuItems.map(item => (
                                        <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <td className="p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMenuItems.includes(item.id)}
                                                    onChange={() => toggleSelectItem(item.id)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                            </td>
                                            <td className="p-3">
                                                {item.image && (
                                                    <div className="relative h-12 w-12 rounded overflow-hidden">
                                                        <Image src={item.image} alt={item.name} fill className="object-cover" onError={(e) => { const target = e.target as HTMLImageElement; target.src = 'https://placehold.co/100x100/e2e8f0/64748b?text=NA'; target.srcset = ''; }} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    {item.description && (
                                                        <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-sm">
                                                {categories.find(c => c.id === item.categoryId)?.name || '-'}
                                            </td>
                                            <td className="p-3 text-sm font-medium text-emerald-600">
                                                Rp {item.price.toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-3 text-sm">
                                                {item.stock !== null && item.stock !== undefined ? item.stock : '-'}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={item.isAvailable}
                                                        onCheckedChange={(val) => handleToggleMenuItem(item.id, val)}
                                                    />
                                                    <span className={`text-xs font-medium ${item.isAvailable ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                        {item.isAvailable ? t('active') : t('disabled')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingMenuItem(item)
                                                            setMenuItemForm(item)
                                                            setMenuItemDialogOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteMenuItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    }

    const renderCategoriesContent = () => (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('categories')}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        <span className={(currentRestaurant?.maxCategories && categories.length >= currentRestaurant.maxCategories) ? 'text-red-500 font-bold' : 'text-emerald-600 font-medium'}>
                            {categories.length} / {currentRestaurant?.maxCategories === 0 || !currentRestaurant?.maxCategories ? t('unlimited') : currentRestaurant.maxCategories} {t('categoriesUsed')}
                        </span>
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCategory(null)
                        setCategoryForm({})
                        setCategoryDialogOpen(true)
                    }}
                    disabled={currentRestaurant?.maxCategories !== 0 && categories.length >= (currentRestaurant?.maxCategories || 0)}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {currentRestaurant?.maxCategories !== 0 && categories.length >= (currentRestaurant?.maxCategories || 0) ? t('limitReached') : t('addCategory')}
                </Button>
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <p>{t('noCategoriesYet')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                        <Card key={category.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>{category.name}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingCategory(category)
                                                setCategoryForm(category)
                                                setCategoryDialogOpen(true)
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteCategory(category.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {category.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{category.description}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-2">
                                    {menuItems.filter(item => item.categoryId === category.id).length} {t('items')}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

    const renderOrdersContent = () => {
        let filteredOrders = orders.filter(order => {
            if (orderStatusFilter !== 'ALL' && order.status !== orderStatusFilter) return false
            return true
        })

        if (orderSearchQuery) {
            const query = orderSearchQuery.toLowerCase()
            filteredOrders = filteredOrders.filter(order =>
                order.orderNumber.toLowerCase().includes(query) ||
                (order.customerName && order.customerName.toLowerCase().includes(query))
            )
        }

        // Pagination Calculations
        const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
        const currentOrders = filteredOrders.slice(
            (orderCurrentPage - 1) * ITEMS_PER_PAGE,
            orderCurrentPage * ITEMS_PER_PAGE
        )

        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('orders')}</h2>
                    <div className="flex gap-2">
                        <Button onClick={() => setManualOrderDialogOpen(true)} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Order Online
                        </Button>
                        <Button onClick={() => loadOrderData()} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {t('refresh')}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="relative flex-grow lg:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={t('searchOrders')}
                            value={orderSearchQuery}
                            onChange={(e) => {
                                setOrderSearchQuery(e.target.value)
                                setOrderCurrentPage(1) // Reset to page 1 on search
                            }}
                            className="pl-9"
                        />
                    </div>

                    <Select value={orderStatusFilter} onValueChange={(val) => {
                        setOrderStatusFilter(val)
                        setOrderCurrentPage(1)
                    }}>
                        <SelectTrigger className="w-full lg:w-40">
                            <SelectValue placeholder={t('filterByStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t('allStatus')}</SelectItem>
                            <SelectItem value="PENDING">{t('statusPending')}</SelectItem>
                            <SelectItem value="CONFIRMED">{t('statusConfirmed')}</SelectItem>
                            <SelectItem value="PREPARING">{t('statusPreparing')}</SelectItem>
                            <SelectItem value="READY">{t('statusReady')}</SelectItem>
                            <SelectItem value="COMPLETED">{t('statusCompleted')}</SelectItem>
                            <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* NEW: Payment Method Filter */}
                    <Select value={orderPaymentFilter} onValueChange={(val) => {
                        setOrderPaymentFilter(val)
                        setOrderCurrentPage(1)
                    }}>
                        <SelectTrigger className="w-full lg:w-40">
                            <SelectValue placeholder={t('paymentMethod')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">{t('allPayments')}</SelectItem>
                            <SelectItem value="QRIS">{t('qris')}</SelectItem>
                            <SelectItem value="CASH">{t('cashPayment')}</SelectItem>
                            <SelectItem value="GOPAY">{t('gopay')}</SelectItem>
                            <SelectItem value="OVO">{t('ovo')}</SelectItem>
                            <SelectItem value="DANA">{t('dana')}</SelectItem>
                            <SelectItem value="SHOPEEPAY">{t('shopeepay')}</SelectItem>
                            <SelectItem value="LINKAJA">{t('linkaja')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={orderDateRange.start}
                            onChange={(e) => setOrderDateRange({ ...orderDateRange, start: e.target.value })}
                            placeholder={t('startDate')}
                        />
                        <Input
                            type="date"
                            value={orderDateRange.end}
                            onChange={(e) => setOrderDateRange({ ...orderDateRange, end: e.target.value })}
                            placeholder={t('endDate')}
                        />
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {currentOrders.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p>{t('noOrdersFound')} {orderStatusFilter !== 'ALL' || orderDateRange.start || orderDateRange.end || orderSearchQuery ? t('tryAdjustingFilters') : t('ordersWillAppearHere')}</p>
                        </div>
                    ) : (
                        currentOrders.map(order => (
                            <Card key={order.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{t('order')} #{order.orderNumber}</CardTitle>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                {order.customerName} ΓÇó {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short', hour12: false })}
                                            </p>
                                            {order.paymentMethod && (
                                                <Badge variant="outline" className="mt-2 mr-2">
                                                    ≡ƒÆ│ {order.paymentMethod}
                                                </Badge>
                                            )}
                                            {(order as any).orderSource && (order as any).orderSource !== 'QR_MENU' && (
                                                <Badge variant="outline" className={`mt-2 ${
                                                    (order as any).orderSource === 'GRABFOOD' ? 'bg-green-100 text-green-700 border-green-300' :
                                                    (order as any).orderSource === 'GOFOOD' ? 'bg-red-100 text-red-700 border-red-300' :
                                                    (order as any).orderSource === 'SHOPEEFOOD' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                                    (order as any).orderSource === 'POS' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                                    'bg-gray-100 text-gray-700 border-gray-300'
                                                }`}>
                                                    {(order as any).orderSource === 'GRABFOOD' ? '≡ƒƒó GrabFood' :
                                                     (order as any).orderSource === 'GOFOOD' ? '≡ƒö┤ GoFood' :
                                                     (order as any).orderSource === 'SHOPEEFOOD' ? '≡ƒƒá ShopeeFood' :
                                                     (order as any).orderSource === 'POS' ? '≡ƒÆ╗ POS' :
                                                     (order as any).orderSource}
                                                </Badge>
                                            )}
                                            {(order as any).adminNotes && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">≡ƒô¥ {(order as any).adminNotes}</p>
                                            )}
                                        </div>
                                        <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                            {order.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 mb-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span>{item.quantity}x {item.menuItemName}</span>
                                                <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">{t('paymentMethod')}:</span>
                                            <span className="text-sm font-medium">{order.paymentMethod || 'CASH'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">Total:</span>
                                            <span className="font-bold">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">

                                        {order.status === 'PENDING' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                                                disabled={updatingOrderId === order.id}
                                            >
                                                {t('confirm')}
                                            </Button>
                                        )}
                                        {order.status === 'CONFIRMED' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                                                disabled={updatingOrderId === order.id}
                                            >
                                                {t('prepare')}
                                            </Button>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
                                                disabled={updatingOrderId === order.id}
                                            >
                                                {t('ready')}
                                            </Button>
                                        )}
                                        {order.status === 'READY' && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                                                disabled={updatingOrderId === order.id}
                                            >
                                                {t('complete')}
                                            </Button>
                                        )}
                                        {['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status) && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    if (confirm(t('cancelOrderConfirm'))) {
                                                        handleUpdateOrderStatus(order.id, 'CANCELLED')
                                                    }
                                                }}
                                                disabled={updatingOrderId === order.id}
                                            >
                                                {t('cancel')}
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setViewOrder(order)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-sm text-slate-500">
                            {t('showing')} {(orderCurrentPage - 1) * ITEMS_PER_PAGE + 1} {t('to')} {Math.min(orderCurrentPage * ITEMS_PER_PAGE, filteredOrders.length)} {t('of')} {filteredOrders.length} {t('orders')}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOrderCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={orderCurrentPage === 1}
                            >
                                {t('previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOrderCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={orderCurrentPage === totalPages}
                            >
                                {t('next')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const renderAnalyticsContent = () => (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('report')}</h2>
                <div className="flex gap-2">
                    <Button onClick={() => handleExportReport()} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {t('exportCsv')}
                    </Button>
                    <Button onClick={() => loadReportsData()} variant="outline" size="sm" disabled={loadingReports}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingReports ? 'animate-spin' : ''}`} />
                        {loadingReports ? t('loading') : t('refresh')}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <Select value={reportGranularity} onValueChange={(value: any) => setReportGranularity(value)}>
                    <SelectTrigger className="w-full lg:w-48">
                        <SelectValue placeholder={t('granularity')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="day">{t('daily')}</SelectItem>
                        <SelectItem value="month">{t('monthly')}</SelectItem>
                        <SelectItem value="year">{t('yearly')}</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Input
                        type="date"
                        value={reportDateRange.start}
                        onChange={(e) => setReportDateRange({ ...reportDateRange, start: e.target.value })}
                        placeholder={t('startDate')}
                    />
                    <Input
                        type="date"
                        value={reportDateRange.end}
                        onChange={(e) => setReportDateRange({ ...reportDateRange, end: e.target.value })}
                        placeholder={t('endDate')}
                    />
                </div>
            </div>

            {/* Stats Grid - reads from nested stats object as returned by the API */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('totalRevenue')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-emerald-600">
                            Rp {(reportStats?.stats?.totalRevenue || 0).toLocaleString('id-ID')}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('totalOrders')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{reportStats?.stats?.totalOrders || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('avgOrderValue')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            Rp {(reportStats?.stats?.averageOrderValue || 0).toLocaleString('id-ID')}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('completedOrders')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{reportStats?.stats?.completedOrders || 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Items and Payment Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {reportStats?.topMenuItems && reportStats.topMenuItems.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('topMenuItems')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {reportStats.topMenuItems.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <span className="text-sm">{item.name}</span>
                                        <div className="flex gap-4 text-sm text-slate-600">
                                            <span>{item.count} {t('orders')}</span>
                                            <span className="font-medium">Rp {item.revenue.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {reportStats?.topPaymentMethods && reportStats.topPaymentMethods.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('topPaymentMethods')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {reportStats.topPaymentMethods.map((method: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <span className="text-sm">≡ƒÆ│ {method.name}</span>
                                        <div className="flex gap-4 text-sm text-slate-600">
                                            <span>{method.count} {t('transactions')}</span>
                                            <span className="font-medium">Rp {(method.revenue || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {!reportStats || Object.keys(reportStats).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <p>{t('noAnalyticsData')}</p>
                </div>
            )}
        </div>
    )

    const renderSettingsContent = () => (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('restaurantSettings')}</h2>
            {loadingRestaurant ? (
                <div className="flex justify-center p-12"><RefreshCw className="h-8 w-8 animate-spin text-emerald-500" /></div>
            ) : settingsError ? (
                <div className="p-6 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl">{settingsError}</div>
            ) : !currentRestaurant ? (
                <div className="p-6 text-slate-500">Restaurant data unavailable.</div>
            ) : (
                <div className="space-y-8">
                    <RestaurantSettingsForm
                        restaurantId={user?.restaurantId || ''}
                        initialData={currentRestaurant}
                    />

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <Printer className="h-5 w-5" /> {t('printerSettings')}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Atur koneksi printer thermal (Bluetooth). Sesuaikan ukuran kertas dan nama perangkat.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="dark:text-white">Ukuran Kertas</Label>
                                <Select value={printerPaperSize} onValueChange={(v: '58mm' | '80mm') => setPrinterPaperSize(v)}>
                                    <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="58mm">58 mm</SelectItem>
                                        <SelectItem value="80mm">80 mm</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-white">Nama/Alamat Bluetooth</Label>
                                <Input
                                    className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="Contoh: InnerPrinter / BT-Printer"
                                    value={printerAddress}
                                    onChange={(e) => setPrinterAddress(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 flex items-center md:items-end">
                                <label className="flex items-center gap-3">
                                    <Switch checked={printerAutoPrint} onCheckedChange={(v) => setPrinterAutoPrint(v)} />
                                    <span className="text-sm text-slate-700 dark:text-slate-200">Auto Print Struk</span>
                                </label>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button onClick={savePrinterSettings} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                <Save className="h-4 w-4 mr-2" /> Simpan Pengaturan Printer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    // ... renderOrdersContent, renderSettingsContent ...

    const renderPaymentsContent = () => (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <PaymentMethods
                methods={paymentMethods}
                onToggle={async (id, isActive) => {
                    // Optimistic update
                    setPaymentMethods(methods => methods.map(m => m.id === id ? { ...m, isActive } : m))
                    try {
                        await fetch(`/api/payment-methods/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isActive })
                        })
                    } catch (error) {
                        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
                        loadRestaurantDetails() // Revert on error
                    }
                }}
                onEdit={(method) => {
                    setPaymentMethodForm(method)
                    setPaymentMethodDialogOpen(true)
                }}
                onDelete={(id) => handleDeletePaymentMethod(id)}
            />
            <div className="mt-6">
                <Button onClick={() => {
                    setPaymentMethodForm({ type: 'QRIS', isActive: true }) // Default
                    setPaymentMethodDialogOpen(true)
                }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addPaymentMethod')}
                </Button>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 lg:pb-0">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                onLogout={logout}
                language={language as 'en' | 'id'}
                onToggleLanguage={() => setLanguage(language === 'en' ? 'id' : 'en')}
                pendingOrderCount={orders.filter(o => o.status === 'PENDING').length}
            />

            <main className="w-full lg:ml-24 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto">
                <Header
                    restaurantName={currentRestaurant?.name || ''}
                    userName={user?.name || ''}
                    onShowQR={() => setQrCodeDialogOpen(true)}
                    onAddItem={() => {
                        setEditingMenuItem(null)
                        setMenuItemForm({})
                        setMenuItemDialogOpen(true)
                    }}
                />

                {!user?.restaurantId && (
                    <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                        <p className="font-bold">ΓÜá∩╕Å {t('warningRestaurantIdNotFound')}</p>
                        <p className="text-sm mt-1">{t('pleaseRelogin')}</p>
                    </div>
                )}

                {activeTab === 'dashboard' && renderDashboardContent()}
                {activeTab === 'menu' && renderMenuContent()}
                {activeTab === 'categories' && renderCategoriesContent()}
                {activeTab === 'orders' && renderOrdersContent()}
                {activeTab === 'analytics' && renderAnalyticsContent()}
                {activeTab === 'payments' && renderPaymentsContent()}
                {activeTab === 'staff' && (
                    <StaffManagement
                        restaurantId={user?.restaurantId || ''}
                        maxStaff={currentRestaurant?.maxStaff || 5}
                    />
                )}
                {activeTab === 'settings' && renderSettingsContent()}
                {activeTab === 'helpdesk' && <HelpdeskChat role="RESTAURANT_ADMIN" />}


            </main>

            {/* Dialogs */}
            <QRCodeDialog
                open={qrCodeDialogOpen}
                onOpenChange={setQrCodeDialogOpen}
                restaurantSlug={currentRestaurant?.slug || currentRestaurant?.id || ''}
                restaurantName={currentRestaurant?.name || 'Restaurant'}
            />

            {/* Payment Method Dialog (Global) */}
            <Dialog open={paymentMethodDialogOpen} onOpenChange={setPaymentMethodDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{paymentMethodForm.id ? t('editPaymentMethod') : t('addPaymentMethod')}</DialogTitle>
                        <DialogDescription>{t('configurePaymentDetails')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-type">{t('paymentMethod')} *</Label>
                            <Select
                                value={paymentMethodForm.type || ''}
                                onValueChange={(value) => setPaymentMethodForm({ ...paymentMethodForm, type: value })}
                            >
                                <SelectTrigger id="payment-type">
                                    <SelectValue placeholder={t('selectPaymentMethod')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="QRIS">{t('qris')}</SelectItem>
                                    <SelectItem value="GOPAY">{t('gopay')}</SelectItem>
                                    <SelectItem value="OVO">{t('ovo')}</SelectItem>
                                    <SelectItem value="DANA">{t('dana')}</SelectItem>
                                    <SelectItem value="LINKAJA">{t('linkaja')}</SelectItem>
                                    <SelectItem value="SHOPEEPAY">{t('shopeepay')}</SelectItem>
                                    <SelectItem value="CASH">{t('cashPayment')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Account Number */}
                        <div className="space-y-2">
                            <Label htmlFor="account-number">{t('accountNumberId')}</Label>
                            <Input
                                id="account-number"
                                type="text"
                                placeholder={t('accountNumberExample')}
                                value={(paymentMethodForm as any).accountNumber || ''}
                                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, accountNumber: e.target.value })}
                            />
                        </div>

                        {/* Account Name */}
                        <div className="space-y-2">
                            <Label htmlFor="account-name">{t('accountName')}</Label>
                            <Input
                                id="account-name"
                                type="text"
                                placeholder={t('accountNameExample')}
                                value={(paymentMethodForm as any).accountName || ''}
                                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, accountName: e.target.value })}
                            />
                        </div>

                        {/* QR Code Upload */}
                        {['QRIS', 'GOPAY', 'DANA', 'OVO', 'SHOPEEPAY', 'LINKAJA'].includes(paymentMethodForm.type || '') && (
                            <div className="space-y-2">
                                <Label htmlFor="qr-image">{t('qrCodeImage')}</Label>
                                <Input
                                    id="qr-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, (base64) => setPaymentMethodForm({ ...paymentMethodForm, qrCode: base64 }))}
                                />
                                {paymentMethodForm.qrCode && (
                                    <div className="mt-2 relative h-32 w-32 border rounded-lg overflow-hidden bg-white">
                                        <Image
                                            src={paymentMethodForm.qrCode}
                                            alt="QR Preview"
                                            fill
                                            className="object-contain"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://placehold.co/200x200/e2e8f0/64748b?text=Invalid+Image';
                                                target.srcset = '';
                                            }}
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6"
                                            onClick={() => setPaymentMethodForm({ ...paymentMethodForm, qrCode: undefined })}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="merchant-id">{t('merchantIdOptional')}</Label>
                            <Input
                                id="merchant-id"
                                value={paymentMethodForm.merchantId || ''}
                                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, merchantId: e.target.value })}
                                placeholder={t('enterMerchantId')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSavePaymentMethod} className="bg-green-600 hover:bg-green-700">
                            {paymentMethodForm.id ? t('saveChanges') : t('addPaymentMethod')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Dialog */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? t('editCategory') : t('addCategory')}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? t('updateCategoryDetails') : t('createCategoryDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">{t('categoryName')} *</Label>
                            <Input
                                id="category-name"
                                value={categoryForm.name || ''}
                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                placeholder={t('categoryNameExample')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category-description">{t('descriptionOptional')}</Label>
                            <Input
                                id="category-description"
                                value={categoryForm.description || ''}
                                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                placeholder={t('briefCategoryDesc')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category-order">{t('displayOrderOptional')}</Label>
                            <Input
                                id="category-order"
                                type="number"
                                value={categoryForm.displayOrder || ''}
                                onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 0 })}
                                placeholder={t('orderInMenuDesc')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveCategory} className="bg-emerald-600 hover:bg-emerald-700">
                            {editingCategory ? t('saveChanges') : t('addCategory')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Menu Item Dialog */}
            <Dialog open={menuItemDialogOpen} onOpenChange={setMenuItemDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingMenuItem ? t('editMenuItem') : t('addMenuItem')}</DialogTitle>
                        <DialogDescription>
                            {editingMenuItem ? t('updateMenuItemDetails') : t('createMenuItemDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="menu-name">{t('name')} *</Label>
                            <Input
                                id="menu-name"
                                value={menuItemForm.name || ''}
                                onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                                placeholder={t('menuItemName')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="menu-description">{t('description')}</Label>
                            <Input
                                id="menu-description"
                                value={menuItemForm.description || ''}
                                onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                                placeholder={t('briefItemDesc')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="menu-price">{t('priceInput')} *</Label>
                            <Input
                                id="menu-price"
                                type="number"
                                value={menuItemForm.price || ''}
                                onChange={(e) => setMenuItemForm({ ...menuItemForm, price: parseFloat(e.target.value) })}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="menu-category">{t('categoryInput')} *</Label>
                            <Select
                                value={menuItemForm.categoryId || ''}
                                onValueChange={(value) => setMenuItemForm({ ...menuItemForm, categoryId: value })}
                            >
                                <SelectTrigger id="menu-category">
                                    <SelectValue placeholder={t('selectCategory')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="menu-image">{t('menuImage')}</Label>
                            <Input
                                id="menu-image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, (base64) => setMenuItemForm({ ...menuItemForm, image: base64 }))}
                            />
                            {menuItemForm.image && (
                                <div className="relative w-full h-40 mt-2 rounded-md overflow-hidden border">
                                    <img src={menuItemForm.image} alt="Preview" className="w-full h-full object-cover" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6"
                                        onClick={() => setMenuItemForm({ ...menuItemForm, image: undefined })}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isBestSeller"
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    checked={menuItemForm.isBestSeller || false}
                                    onChange={(e) => setMenuItemForm({ ...menuItemForm, isBestSeller: e.target.checked })}
                                />
                                <Label htmlFor="isBestSeller" className="cursor-pointer font-medium">{t('bestSeller')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isRecommended"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={menuItemForm.isRecommended || false}
                                    onChange={(e) => setMenuItemForm({ ...menuItemForm, isRecommended: e.target.checked })}
                                />
                                <Label htmlFor="isRecommended" className="cursor-pointer font-medium">{t('recommended')}</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveMenuItem} className="bg-green-600 hover:bg-green-700">
                            {editingMenuItem ? t('saveChanges') : t('add')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Validation Dialog */}
            <Dialog open={!!validateOrderId} onOpenChange={(open) => !open && setValidateOrderId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('confirmAcceptOrder')}</DialogTitle>
                        <DialogDescription>
                            {t('manualNotifyDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label>{t('manualEmail')}</Label>
                            <Input
                                placeholder="customer@example.com"
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t('manualPhone')}</Label>
                            <Input
                                placeholder="62812..."
                                value={manualPhone}
                                onChange={(e) => setManualPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setValidateOrderId(null)}>{t('cancelItem')}</Button>
                        <Button className="bg-green-600 text-white" onClick={handleValidateOrder}>{t('confirmAndNotify')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Order Dialog */}
            <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('orderDetails')} #{viewOrder?.orderNumber}</DialogTitle>
                    </DialogHeader>
                    {viewOrder && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">{t('date')}:</span>
                                <span className="font-medium">{new Date(viewOrder.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short', hour12: false })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">{t('customer')}:</span>
                                <span className="font-medium">{viewOrder.customerName}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">{t('type')}:</span>
                                <Badge variant="outline">
                                    {(!viewOrder.tableNumber || viewOrder.tableNumber === 'TAKEAWAY') ? t('takeAway') : t('dineIn')}
                                </Badge>
                            </div>
                            {viewOrder.tableNumber && viewOrder.tableNumber !== 'TAKEAWAY' && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">{t('table')}:</span>
                                    <span className="font-medium">{viewOrder.tableNumber}</span>
                                </div>
                            )}

                            {(viewOrder as any)?.orderSource && (viewOrder as any).orderSource !== 'QR_MENU' && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Sumber:</span>
                                    <Badge variant="outline" className={`${
                                        (viewOrder as any).orderSource === 'GRABFOOD' ? 'bg-green-100 text-green-700' :
                                        (viewOrder as any).orderSource === 'GOFOOD' ? 'bg-red-100 text-red-700' :
                                        (viewOrder as any).orderSource === 'SHOPEEFOOD' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {(viewOrder as any).orderSource}
                                    </Badge>
                                </div>
                            )}
                            {(viewOrder as any)?.adminNotes && (
                                <div className="flex justify-between items-start text-sm">
                                    <span className="text-gray-500">Catatan Admin:</span>
                                    <span className="font-medium text-right max-w-[60%]">{(viewOrder as any).adminNotes}</span>
                                </div>
                            )}
                            <div className="border-t border-b py-2 my-2 space-y-2">
                                {viewOrder.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.menuItemName}</span>
                                        <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>{t('total')}:</span>
                                <span>Rp {viewOrder.totalAmount.toLocaleString('id-ID')}</span>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                {viewOrder.customerId && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={async () => {
                                            if (confirm(`${t('deleteCustomerWarning')} ${viewOrder.customerName}? ${t('deleteCustomerWarningDesc')}`)) {
                                                try {
                                                    const res = await fetch(`/api/users/${viewOrder.customerId}`, { method: 'DELETE' })
                                                    const data = await res.json()
                                                    if (data.success) {
                                                        toast({ title: 'Success', description: data.message || t('customerDeleted') })
                                                        setViewOrder(null) // Close dialog
                                                    } else {
                                                        toast({ title: 'Error', variant: 'destructive', description: data.error || t('failedToDeleteCustomer') })
                                                    }
                                                } catch (err) {
                                                    toast({ title: 'Error', variant: 'destructive', description: t('networkErrorDeletingCustomer') })
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" /> {t('deleteCustomer')}
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => handlePrintOrder(viewOrder)}>
                                    <Printer className="h-4 w-4 mr-2" /> {t('print')}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Manual Order Dialog (Admin Note Feature) */}
            <Dialog open={manualOrderDialogOpen} onOpenChange={setManualOrderDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg">
                    <DialogHeader>
                        <DialogTitle>≡ƒôï Input Order Online</DialogTitle>
                        <DialogDescription>Catat pesanan dari platform online (GrabFood, GoFood, ShopeeFood)</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Platform Sumber *</Label>
                            <Select value={manualOrderForm.orderSource} onValueChange={(val) => setManualOrderForm({ ...manualOrderForm, orderSource: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GRABFOOD">≡ƒƒó GrabFood</SelectItem>
                                    <SelectItem value="GOFOOD">≡ƒö┤ GoFood</SelectItem>
                                    <SelectItem value="SHOPEEFOOD">≡ƒƒá ShopeeFood</SelectItem>
                                    <SelectItem value="OTHER">≡ƒôª Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Customer *</Label>
                            <Input
                                value={manualOrderForm.customerName}
                                onChange={(e) => setManualOrderForm({ ...manualOrderForm, customerName: e.target.value })}
                                placeholder="Nama dari aplikasi..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Catatan Admin (opsional)</Label>
                            <Input
                                value={manualOrderForm.adminNotes}
                                onChange={(e) => setManualOrderForm({ ...manualOrderForm, adminNotes: e.target.value })}
                                placeholder="No. order Grab/Gojek, instruksi khusus, dll..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Metode Bayar</Label>
                            <Select value={manualOrderForm.paymentMethod} onValueChange={(val) => setManualOrderForm({ ...manualOrderForm, paymentMethod: val })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Tunai</SelectItem>
                                    {paymentMethods.filter(m => m.isActive).map(m => (
                                        <SelectItem key={m.id} value={m.type}>{m.type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Menu Item Picker */}
                        <div className="space-y-2">
                            <Label>Pilih Menu *</Label>
                            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                                {menuItems.filter(m => m.isAvailable).map(item => {
                                    const existingIdx = manualOrderForm.items.findIndex(i => i.menuItemId === item.id)
                                    const qty = existingIdx >= 0 ? manualOrderForm.items[existingIdx].quantity : 0
                                    return (
                                        <div key={item.id} className="flex items-center justify-between py-1">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{item.name}</p>
                                                <p className="text-xs text-gray-500">Rp {item.price.toLocaleString('id-ID')}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="icon" className="h-7 w-7"
                                                    onClick={() => {
                                                        if (qty <= 0) return
                                                        const newItems = [...manualOrderForm.items]
                                                        if (qty === 1) {
                                                            newItems.splice(existingIdx, 1)
                                                        } else {
                                                            newItems[existingIdx].quantity = qty - 1
                                                        }
                                                        setManualOrderForm({ ...manualOrderForm, items: newItems })
                                                    }}
                                                    disabled={qty === 0}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-sm font-bold w-6 text-center">{qty}</span>
                                                <Button variant="outline" size="icon" className="h-7 w-7"
                                                    onClick={() => {
                                                        const newItems = [...manualOrderForm.items]
                                                        if (existingIdx >= 0) {
                                                            newItems[existingIdx].quantity = qty + 1
                                                        } else {
                                                            newItems.push({ menuItemId: item.id, quantity: 1 })
                                                        }
                                                        setManualOrderForm({ ...manualOrderForm, items: newItems })
                                                    }}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {manualOrderForm.items.length > 0 && (
                                <p className="text-sm text-emerald-600 font-medium">
                                    {manualOrderForm.items.reduce((s, i) => s + i.quantity, 0)} item dipilih ΓÇó{' '}
                                    Rp {manualOrderForm.items.reduce((total, i) => {
                                        const mi = menuItems.find(m => m.id === i.menuItemId)
                                        return total + (mi ? mi.price * i.quantity : 0)
                                    }, 0).toLocaleString('id-ID')}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setManualOrderDialogOpen(false)}>Batal</Button>
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={handleCreateManualOrder}
                            disabled={submittingManualOrder}
                        >
                            {submittingManualOrder ? <Loader2 className="animate-spin h-4 w-4" /> : '≡ƒôï Catat Order'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
