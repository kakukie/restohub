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
     * Build ESC/POS receipt bytes.
     */
    buildReceipt(order: any, restaurant: any): Uint8Array {
        const encoder = new EscPosEncoder();
        let receipt = encoder.initialize()
            .codepage('cp858')
            .align('center');

        if (restaurant?.name) {
            receipt = receipt.bold(true).text(restaurant.name).newline().bold(false);
        }
        if (restaurant?.address) {
            receipt = receipt.text(restaurant.address).newline();
        }
        if (restaurant?.phone) {
            receipt = receipt.text(restaurant.phone).newline();
        }

        receipt = receipt.newline().line('-').newline();
        receipt = receipt.align('left')
            .text(`No: #${order.orderNumber}`).newline()
            .text(`Tgl: ${new Date(order.createdAt).toLocaleString('id-ID')}`).newline()
            .text(`Cust: ${order.customerName || 'Guest'}`).newline()
            .text(`Tipe: ${order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway'}`).newline();

        receipt = receipt.newline().line('-').newline();

        if (order.items && order.items.length > 0) {
            order.items.forEach((item: any) => {
                const itemTotal = item.price * item.quantity;
                receipt = receipt.text(`${item.quantity}x ${item.menuItemName || item.name || ''}`).newline();
                receipt = receipt.align('right').text(`Rp ${(itemTotal).toLocaleString('id-ID')}`).newline().align('left');
                if (item.notes) {
                    receipt = receipt.text(`  catatan: ${item.notes}`).newline();
                }
            });
        }

        receipt = receipt.newline().line('-').newline();
        receipt = receipt.align('right').bold(true)
            .text(`TOTAL: Rp ${order.totalAmount.toLocaleString('id-ID')}`).newline()
            .bold(false).align('center');

        receipt = receipt.newline().line('-').newline();
        receipt = receipt.text("Terima kasih atas kunjungan Anda!").newline()
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
            }
        }
    }

    /**
     * Print a receipt.
     */
    async printReceipt(order: any, restaurant: any): Promise<void> {
        const data = this.buildReceipt(order, restaurant);
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
