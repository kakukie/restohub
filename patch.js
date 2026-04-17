const fs = require('fs');

const file = 'c:/Users/LEGION Y530/Documents/DocOfWork/restohub/src/components/dashboards/RestaurantAdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf-8');

const target = `    const handleCreateManualOrder = async () => {
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
                    notes: \`[\${manualOrderForm.orderSource}] \${manualOrderForm.adminNotes}\`,
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
                toast({ title: 'Berhasil', description: \`Order \${manualOrderForm.orderSource} berhasil dicatat!\` })
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
    }`;

const replacement = `    const handleCreateManualOrder = async () => {
        if (!manualOrderForm.customerName) {
            return toast({ title: 'Error', description: 'Nama customer wajib diisi', variant: 'destructive' })
        }
        if (manualOrderForm.items.length === 0) {
            return toast({ title: 'Error', description: 'Pilih minimal 1 menu item', variant: 'destructive' })
        }

        const payload = {
            restaurantId: user?.restaurantId,
            customerName: manualOrderForm.customerName,
            tableNumber: manualOrderForm.tableNumber || 'ONLINE',
            notes: \`[\${manualOrderForm.orderSource}] \${manualOrderForm.adminNotes}\`,
            paymentMethod: manualOrderForm.paymentMethod || 'CASH',
            orderSource: manualOrderForm.orderSource,
            adminNotes: manualOrderForm.adminNotes,
            items: manualOrderForm.items.filter(i => i.quantity > 0).map(i => ({
                menuItemId: i.menuItemId,
                quantity: i.quantity,
                price: 0,
                notes: ''
            }))
        }

        if (!navigator.onLine) {
            const currentOffline = JSON.parse(localStorage.getItem('offline_orders') || '[]')
            const offlinePayload = { ...payload, _offlineId: Date.now() }
            localStorage.setItem('offline_orders', JSON.stringify([...currentOffline, offlinePayload]))
            setOfflineOrders(prev => [...prev, offlinePayload])
            
            toast({ title: 'Offline Mode', description: \`Order disimpan offline. Harap sinkronkan nanti.\` })
            setManualOrderDialogOpen(false)
            setManualOrderForm({
                customerName: '',
                orderSource: 'GRABFOOD',
                adminNotes: '',
                tableNumber: '',
                paymentMethod: 'CASH',
                items: []
            })
            return
        }

        setSubmittingManualOrder(true)
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (data.success) {
                toast({ title: 'Berhasil', description: \`Order \${manualOrderForm.orderSource} berhasil dicatat!\` })
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

    const syncOfflineOrders = async () => {
        const currentOffline = JSON.parse(localStorage.getItem('offline_orders') || '[]')
        if (currentOffline.length === 0) return

        setIsSyncingOffline(true)
        let successCount = 0

        for (const order of currentOffline) {
            try {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                })
                if (res.ok) {
                    successCount++
                }
            } catch (err) {
                console.error('Failed to sync order', err)
            }
        }

        if (successCount === currentOffline.length) {
            localStorage.removeItem('offline_orders')
            setOfflineOrders([])
            toast({ title: 'Sinkronisasi Selesai', description: \`\${successCount} order berhasil disinkronkan.\` })
            loadOrderData()
        } else {
            toast({ title: 'Sinkronisasi Parsial', description: \`Berhasil sinkron \${successCount} dari \${currentOffline.length} order. Coba lagi.\` })
        }
        setIsSyncingOffline(false)
    }

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('offline_orders') || '[]')
        setOfflineOrders(stored)
    }, [])`;

// Instead of exact match which might fail on spaces/newlines, we replace using regex
const regex = new RegExp(target.replace(/[.*+?^$\{key\}\(\)|\[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Success');
} else {
    console.log('Regex match failed');
    // fallback: just find "const handleCreateManualOrder = async () => {"
    const startIndex = content.indexOf('const handleCreateManualOrder = async () => {');
    const endIndex = content.indexOf('    // --- HELPER FUNCTIONS ---');
    if (startIndex !== -1 && endIndex !== -1) {
        content = content.substring(0, startIndex) + replacement + '\n\n' + content.substring(endIndex);
        fs.writeFileSync(file, content, 'utf-8');
        console.log('Fallback Success');
    } else {
        console.log('Fallback failed too');
    }
}
