/**
 * Capacitor BLE Bluetooth Printer Service
 * 
 * Uses @capacitor-community/bluetooth-le for native BLE access on Android.
 * Falls back to Web Bluetooth API for browser/desktop.
 * 
 * This service can auto-connect to a saved printer without user interaction.
 */
import EscPosEncoder from 'esc-pos-encoder';

// Common thermal printer BLE service UUIDs
const PRINTER_SERVICE_UUIDS = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];

// Common name prefixes for thermal printers
const PRINTER_NAME_PREFIXES = ['MPT', 'PT', 'Blue', 'Inner', 'Printer', 'POS', 'RPP', 'MTP', 'TSC', 'XP', 'ZJ'];

interface PrinterDevice {
    deviceId: string;
    name: string;
    serviceUUID: string;
    characteristicUUID: string;
}

export class CapacitorBluetoothPrinterService {
    private connectedDevice: PrinterDevice | null = null;
    private BleClient: any = null;
    private isNative = false;

    constructor() {
        this.detectPlatform();
    }

    private async detectPlatform() {
        try {
            const { BleClient } = await import('@capacitor-community/bluetooth-le');
            this.BleClient = BleClient;
            // Check if running in native Capacitor context
            const { Capacitor } = await import('@capacitor/core');
            this.isNative = Capacitor.isNativePlatform();
        } catch {
            this.isNative = false;
        }
    }

    /**
     * Initialize BLE - must be called before scan/connect.
     */
    async initialize(): Promise<void> {
        if (!this.BleClient) {
            try {
                const { BleClient } = await import('@capacitor-community/bluetooth-le');
                this.BleClient = BleClient;
            } catch {
                console.warn('BleClient not available, falling back to Web Bluetooth');
                return;
            }
        }
        try {
            await this.BleClient.initialize({ androidNeverForLocation: true });
        } catch (e) {
            console.warn('BLE initialize warning:', e);
        }
    }

    /**
     * Scan for nearby BLE thermal printers.
     * Returns a list of discovered devices.
     */
    async scanForPrinters(timeoutMs = 5000): Promise<{ deviceId: string; name: string }[]> {
        if (!this.isNative || !this.BleClient) {
            throw new Error('Native BLE scan hanya tersedia di aplikasi Android/iOS.');
        }

        await this.initialize();

        const devices: { deviceId: string; name: string }[] = [];

        await this.BleClient.requestLEScan(
            { allowDuplicates: false },
            (result: any) => {
                const name = result.device?.name || result.localName || '';
                const deviceId = result.device?.deviceId || '';
                if (
                    name &&
                    deviceId &&
                    PRINTER_NAME_PREFIXES.some(p => name.toUpperCase().startsWith(p.toUpperCase())) &&
                    !devices.find(d => d.deviceId === deviceId)
                ) {
                    devices.push({ deviceId, name });
                }
            }
        );

        // Wait for scan duration
        await new Promise(resolve => setTimeout(resolve, timeoutMs));
        await this.BleClient.stopLEScan();

        return devices;
    }

    /**
     * Connect to a specific printer by deviceId (Capacitor native).
     * Can auto-connect without user interaction.
     */
    async connectByDeviceId(deviceId: string): Promise<boolean> {
        if (!this.isNative || !this.BleClient) {
            throw new Error('Native BLE connect hanya tersedia di APK.');
        }

        await this.initialize();

        try {
            await this.BleClient.connect(deviceId, (disconnectedDeviceId: string) => {
                console.log('Printer disconnected:', disconnectedDeviceId);
                if (this.connectedDevice?.deviceId === disconnectedDeviceId) {
                    this.connectedDevice = null;
                }
            });

            // Discover services and find writable characteristic
            const services = await this.BleClient.getServices(deviceId);
            
            for (const service of services) {
                const svcUuid = service.uuid.toLowerCase();
                // Check if it's a known printer service
                const isKnownService = PRINTER_SERVICE_UUIDS.some(u => svcUuid.includes(u));
                if (!isKnownService && !svcUuid.startsWith('0000')) continue;

                for (const char of (service.characteristics || [])) {
                    const props = char.properties;
                    if (props?.write || props?.writeWithoutResponse) {
                        this.connectedDevice = {
                            deviceId,
                            name: '',
                            serviceUUID: service.uuid,
                            characteristicUUID: char.uuid
                        };
                        return true;
                    }
                }
            }

            // If no known service found, try all services
            for (const service of services) {
                for (const char of (service.characteristics || [])) {
                    const props = char.properties;
                    if (props?.write || props?.writeWithoutResponse) {
                        this.connectedDevice = {
                            deviceId,
                            name: '',
                            serviceUUID: service.uuid,
                            characteristicUUID: char.uuid
                        };
                        return true;
                    }
                }
            }

            throw new Error('Tidak menemukan characteristic yang bisa ditulis pada printer.');
        } catch (error: any) {
            console.error('BLE Connect Error:', error);
            throw new Error(error.message || 'Gagal terkoneksi ke printer.');
        }
    }

    /**
     * Auto-connect: scan then connect to first matching printer,
     * or connect by saved name.
     */
    async autoConnect(savedPrinterName?: string): Promise<boolean> {
        if (!this.isNative) {
            // Fallback to Web Bluetooth (requires user gesture)
            return this.connectWebBluetooth();
        }

        await this.initialize();

        const devices = await this.scanForPrinters(4000);

        if (devices.length === 0) {
            throw new Error('Tidak ditemukan printer Bluetooth di sekitar. Pastikan printer menyala dan Bluetooth HP aktif.');
        }

        // Prefer saved printer name
        let target = devices[0];
        if (savedPrinterName) {
            const saved = devices.find(d => d.name.toLowerCase().includes(savedPrinterName.toLowerCase()));
            if (saved) target = saved;
        }

        return this.connectByDeviceId(target.deviceId);
    }

    /**
     * Fallback: Web Bluetooth (requires user click/gesture, shows browser dialog).
     */
    private async connectWebBluetooth(): Promise<boolean> {
        if (!navigator.bluetooth) {
            throw new Error('Bluetooth tidak didukung di browser ini.');
        }

        const device = await (navigator as any).bluetooth.requestDevice({
            filters: [
                { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
                ...PRINTER_NAME_PREFIXES.map(p => ({ namePrefix: p }))
            ],
            optionalServices: PRINTER_SERVICE_UUIDS
        });

        const server = await device.gatt.connect();

        let service: any = null;
        for (const uuid of PRINTER_SERVICE_UUIDS) {
            try {
                service = await server.getPrimaryService(uuid);
                break;
            } catch { /* try next */ }
        }
        if (!service) {
            const services = await server.getPrimaryServices();
            service = services[0];
        }

        const characteristics = await service.getCharacteristics();
        const writableChar = characteristics.find(
            (c: any) => c.properties.write || c.properties.writeWithoutResponse
        );

        if (!writableChar) {
            throw new Error('Tidak menemukan port write pada printer.');
        }

        // Store as a pseudo-connected device for the write methods
        this.connectedDevice = {
            deviceId: '__web_bluetooth__',
            name: device.name || 'Printer',
            serviceUUID: service.uuid,
            characteristicUUID: writableChar.uuid
        };

        // Store web bluetooth references
        (this as any)._webDevice = device;
        (this as any)._webCharacteristic = writableChar;

        return true;
    }

    /**
     * Fetch an image from URL and convert to ImageData for ESC/POS printing.
     */
    private async getImageData(url: string, maxWidth = 180): Promise<ImageData | null> {
        if (typeof window === 'undefined') return null;
        
        return new Promise(async (resolve) => {
            try {
                // Try fetching first to handle potential CORS issues better
                const response = await fetch(url, { mode: 'cors' });
                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);
                
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (!ctx) {
                        URL.revokeObjectURL(objectURL);
                        resolve(null);
                        return;
                    }

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    const imageData = ctx.getImageData(0, 0, width, height);
                    URL.revokeObjectURL(objectURL);
                    resolve(imageData);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectURL);
                    resolve(null);
                };
                img.src = objectURL;
            } catch (e) {
                console.warn("Fetch failed for logo, trying direct Image load:", e);
                // Fallback to direct Image load
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { resolve(null); return; }
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(ctx.getImageData(0, 0, width, height));
                };
                img.onerror = () => resolve(null);
                img.src = url;
            }
        });
    }

    /**
     * Build ESC/POS receipt bytes.
     */
    async buildReceipt(order: any, restaurant: any): Promise<Uint8Array> {
        const encoder = new EscPosEncoder();
        const lineWidth = 32; // Standard for 58mm
        
        let receipt = encoder.initialize()
            .codepage('cp858')
            .align('center');

        // 1. Logo
        const logoUrl = restaurant?.logo || restaurant?.logoUrl;
        if (logoUrl) {
            try {
                const imageData = await this.getImageData(logoUrl, 160); // Smaller logo for reliability
                if (imageData) {
                    receipt = receipt.image(imageData, imageData.width, imageData.height, 'threshold', 128);
                    receipt = receipt.newline();
                }
            } catch (e) {}
        }

        // 2. Header Information
        receipt = receipt.align('center');
        if (restaurant?.name) {
            receipt = receipt.bold(true).text(restaurant.name.toUpperCase()).newline().bold(false);
        }
        if (restaurant?.address) {
            receipt = receipt.text(restaurant.address).newline();
        }
        if (restaurant?.phone) {
            receipt = receipt.text(`Telp: ${restaurant.phone}`).newline();
        }

        receipt = receipt.text('-'.repeat(lineWidth)).newline();

        // 3. Order Metadata
        receipt = receipt.align('left')
            .text(`No: #${order.orderNumber || order.id.slice(-8).toUpperCase()}`).newline()
            .text(`Tgl: ${new Date(order.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })}`).newline()
            .text(`Cust: ${order.customerName || 'Guest'}`).newline()
            .text(`Tipe: ${order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway'}`).newline();

        receipt = receipt.text('-'.repeat(lineWidth)).newline();

        // 4. Order Items
        if (order.items && order.items.length > 0) {
            order.items.forEach((item: any) => {
                const itemTotal = item.price * item.quantity;
                const name = `${item.quantity}x ${item.menuItemName || item.name || ''}`;
                const price = `Rp ${itemTotal.toLocaleString('id-ID')}`;
                
                // If name + price fits on one line, use padding. Else split.
                if (name.length + price.length + 1 <= lineWidth) {
                    const padding = lineWidth - name.length - price.length;
                    receipt = receipt.text(name + ' '.repeat(padding) + price).newline();
                } else {
                    receipt = receipt.text(name).newline();
                    const padding = lineWidth - price.length;
                    receipt = receipt.text(' '.repeat(padding) + price).newline();
                }
                
                if (item.notes) {
                    receipt = receipt.text(`  (${item.notes})`).newline();
                }
            });
        }

        receipt = receipt.text('-'.repeat(lineWidth)).newline();

        // 5. Totals
        const subtotalLabel = "SUBTOTAL:";
        const subtotalVal = `Rp ${order.totalAmount.toLocaleString('id-ID')}`;
        const subtotalPadding = lineWidth - subtotalLabel.length - subtotalVal.length;
        
        receipt = receipt.align('left')
            .text(subtotalLabel + ' '.repeat(Math.max(0, subtotalPadding)) + subtotalVal).newline();

        if (order.shippingCost > 0) {
            const shippingLabel = "ONGKIR:";
            const shippingVal = `Rp ${order.shippingCost.toLocaleString('id-ID')}`;
            const shippingPadding = lineWidth - shippingLabel.length - shippingVal.length;
            receipt = receipt.text(shippingLabel + ' '.repeat(Math.max(0, shippingPadding)) + shippingVal).newline();
        }

        const totalLabel = "TOTAL:";
        const totalAmount = order.totalAmount + (order.shippingCost || 0);
        const totalVal = `Rp ${totalAmount.toLocaleString('id-ID')}`;
        const totalPadding = lineWidth - totalLabel.length - totalVal.length;
        
        receipt = receipt.bold(true)
            .text(totalLabel + ' '.repeat(Math.max(0, totalPadding)) + totalVal).newline()
            .bold(false);

        receipt = receipt.text('-'.repeat(lineWidth)).newline();

        // 6. Footer
        receipt = receipt.align('center')
            .text("Terima kasih atas kunjungan Anda!").newline()
            .text("Layanan Menu Digital oleh Meenuin").newline();

        receipt = receipt.newline().newline().newline().cut().encode();
        return receipt;
    }

    /**
     * Send data to the connected printer.
     */
    async writeData(data: Uint8Array): Promise<void> {
        if (!this.connectedDevice) {
            throw new Error('Printer belum terkoneksi.');
        }

        const chunkSize = 100;

        if (this.connectedDevice.deviceId === '__web_bluetooth__') {
            // Web Bluetooth path
            const char = (this as any)._webCharacteristic;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                if (char.properties.writeWithoutResponse) {
                    await char.writeValueWithoutResponse(chunk);
                } else {
                    await char.writeValue(chunk);
                }
            }
        } else {
            // Capacitor BLE path
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
                
                await this.BleClient.write(
                    this.connectedDevice.deviceId,
                    this.connectedDevice.serviceUUID,
                    this.connectedDevice.characteristicUUID,
                    dataView
                );
                await new Promise(r => setTimeout(r, 20)); // Add 20ms delay
            }
        }
    }

    /**
     * Print a receipt.
     */
    async printReceipt(order: any, restaurant: any): Promise<void> {
        const data = await this.buildReceipt(order, restaurant);
        await this.writeData(data);
    }

    /**
     * Disconnect from the printer.
     */
    async disconnect(): Promise<void> {
        if (!this.connectedDevice) return;

        try {
            if (this.connectedDevice.deviceId === '__web_bluetooth__') {
                const device = (this as any)._webDevice;
                if (device?.gatt?.connected) device.gatt.disconnect();
            } else if (this.BleClient) {
                await this.BleClient.disconnect(this.connectedDevice.deviceId);
            }
        } catch (e) {
            console.warn('Disconnect warning:', e);
        }
        this.connectedDevice = null;
    }

    get isConnected(): boolean {
        return this.connectedDevice !== null;
    }

    get deviceName(): string {
        return this.connectedDevice?.name || '';
    }
}

// Singleton instance
export const printerService = new CapacitorBluetoothPrinterService();
