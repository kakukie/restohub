const fs = require('fs');
const file = 'c:\\Users\\LEGION Y530\\Documents\\DocOfWork\\restohub\\src\\components\\dashboards\\RestaurantAdminDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Insert the state
code = code.replace(
    'const [submittingManualOrder, setSubmittingManualOrder] = useState(false)',
    'const [submittingManualOrder, setSubmittingManualOrder] = useState(false)\n    const [offlineOrders, setOfflineOrders] = useState<any[]>([])\n    const [isSyncingOffline, setIsSyncingOffline] = useState(false)'
);

// Replace handleCreateManualOrder
const oldFuncStart = `    const handleCreateManualOrder = async () => {
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

const newFunc = `    const handleCreateManualOrder = async () => {
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
        };

        if (!navigator.onLine) {
            const currentOffline = JSON.parse(localStorage.getItem('offline_orders') || '[]');
            const offlinePayload = { ...payload, _offlineId: Date.now() };
            localStorage.setItem('offline_orders', JSON.stringify([...currentOffline, offlinePayload]));
            setOfflineOrders(prev => [...prev, offlinePayload]);
            
            toast({ title: 'Offline Mode', description: 'Order disimpan offline. Harap sinkronkan nanti.' });
            setManualOrderDialogOpen(false);
            setManualOrderForm({
                customerName: '',
                orderSource: 'GRABFOOD',
                adminNotes: '',
                tableNumber: '',
                paymentMethod: 'CASH',
                items: []
            });
            return;
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
        const currentOffline = JSON.parse(localStorage.getItem('offline_orders') || '[]');
        if (currentOffline.length === 0) return;

        setIsSyncingOffline(true);
        let successCount = 0;

        for (const order of currentOffline) {
            try {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                });
                if (res.ok) {
                    successCount++;
                }
            } catch (err) {
                console.error('Failed to sync order', err);
            }
        }

        if (successCount === currentOffline.length) {
            localStorage.removeItem('offline_orders');
            setOfflineOrders([]);
            toast({ title: 'Sinkronisasi Selesai', description: \`\${successCount} order berhasil disinkronkan.\` });
            loadOrderData();
        } else {
            toast({ title: 'Sinkronisasi Parsial', description: \`Berhasil sinkron \${successCount} dari \${currentOffline.length} order. Coba lagi.\` });
        }
        setIsSyncingOffline(false);
    }

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('offline_orders') || '[]');
        setOfflineOrders(stored);
    }, []);`;

code = code.replace(oldFuncStart, newFunc);

// Add the sync button inside renderOrdersContent
const ordersContentButtonTarget = `                        <Button onClick={() => setManualOrderDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Plus className="h-4 w-4 mr-2" /> {t('addManualOrder')}
                        </Button>`;
                        
const ordersContentButtonReplace = `                        <Button onClick={() => setManualOrderDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Plus className="h-4 w-4 mr-2" /> {t('addManualOrder')}
                        </Button>
                        {offlineOrders.length > 0 && (
                            <Button 
                                onClick={syncOfflineOrders} 
                                disabled={isSyncingOffline || !navigator.onLine}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                <RefreshCw className={\`h-4 w-4 mr-2 \${isSyncingOffline ? 'animate-spin' : ''}\`} /> 
                                Sync {offlineOrders.length} Offline Orders
                            </Button>
                        )}`;

code = code.replace(ordersContentButtonTarget, ordersContentButtonReplace);

fs.writeFileSync(file, code);
console.log('Successfully updated offline functionality');
