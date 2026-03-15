import EscPosEncoder from 'esc-pos-encoder';

export class BluetoothPrinterService {
    private device: any = null;
    private server: any = null;
    private service: any = null;
    private characteristic: any = null;

    /**
     * Connect to a Bluetooth Thermal Printer using Web Bluetooth API.
     */
    async connect() {
        try {
            if (!navigator.bluetooth) {
                throw new Error("Pencetakan Bluetooth tidak didukung di browser/perangkat ini.");
            }

            // Minta izin ke user untuk memilih perangkat Bluetooth printer
            this.device = await (navigator as any).bluetooth.requestDevice({
                filters: [
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard printer service UUID
                    { namePrefix: 'MPT' },
                    { namePrefix: 'PT' },
                    { namePrefix: 'Blue' },
                    { namePrefix: 'Inner' }, // Sunmi inner printer usually
                ],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'] 
            });

            this.server = await this.device.gatt.connect();
            
            // Try standard services first 
            try {
                this.service = await this.server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            } catch(e) {
                // fallback to finding any available service with write capabilities 
                const services = await this.server.getPrimaryServices();
                this.service = services[0]; 
            }

            const characteristics = await this.service.getCharacteristics();
            // Temukan characteristic yang mendukung format 'write' atau 'writeWithoutResponse'
            this.characteristic = characteristics.find(
                (c: any) => c.properties.write || c.properties.writeWithoutResponse
            );

            if (!this.characteristic) {
                throw new Error("Tidak menemukan port write yang valid pada printer ini.");
            }

            return true;
        } catch (error: any) {
            console.error("Bluetooth Connect Error:", error);
            throw new Error(error.message || "Gagal terkoneksi ke printer Bluetooth.");
        }
    }

    /**
     * Build ESC/POS Byte Array dari Data Order
     */
    buildReceipt(order: any, restaurant: any): Uint8Array {
        const encoder = new EscPosEncoder();
        let receipt = encoder.initialize()
            .codepage('cp858')
            .align('center');

        // ==== Header Restoran ====
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

        // ==== Info Pesanan ====
        receipt = receipt.align('left')
            .text(`No: #${order.orderNumber}`).newline()
            .text(`Tgl: ${new Date(order.createdAt).toLocaleString('id-ID')}`).newline()
            .text(`Cust: ${order.customerName || 'Guest'}`).newline()
            .text(`Tipe: ${order.tableNumber ? `Meja ${order.tableNumber}` : 'Takeaway'}`).newline();

        receipt = receipt.newline().line('-').newline();

        // ==== Item Pesanan ====
        if (order.items && order.items.length > 0) {
            order.items.forEach((item: any) => {
                const itemTotal = item.price * item.quantity;
                const qtyStr = `${item.quantity}x`;
                
                // Format simpel: 2x Nasi Goreng  Rp 40.000
                receipt = receipt.text(`${qtyStr} ${item.menuItemName}`).newline();
                receipt = receipt.align('right').text(`Rp ${(itemTotal).toLocaleString('id-ID')}`).newline().align('left');
                
                if (item.notes) {
                    receipt = receipt.text(`  catatan: ${item.notes}`).newline();
                }
            });
        }

        receipt = receipt.newline().line('-').newline();

        // ==== Total ====
        receipt = receipt.align('right').bold(true)
            .text(`TOTAL: Rp ${order.totalAmount.toLocaleString('id-ID')}`).newline()
            .bold(false).align('center');

        receipt = receipt.newline().line('-').newline();

        // ==== Footer ====
        receipt = receipt.text("Terima kasih atas kunjungan Anda!").newline()
            .text("Layanan Menu Digital oleh Meenuin").newline();

        // Cut paper and open cash drawer if supported
        receipt = receipt.newline().newline().newline().cut().encode();

        return receipt;
    }

    /**
     * Send Byte Array ke Printer Characteristic per potongan kecil (MTU size)
     */
    async printReceipt(order: any, restaurant: any) {
        if (!this.characteristic) {
            await this.connect();
        }
        
        try {
            const data = this.buildReceipt(order, restaurant);
            
            // Pengiriman bluetooth sering terbatas 20-512 byte (disarankan potong 100 byte jika gagal)
            const chunkSize = 100; 
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                if (this.characteristic.properties.writeWithoutResponse) {
                   await this.characteristic.writeValueWithoutResponse(chunk);
                } else {
                   await this.characteristic.writeValue(chunk);
                }
            }
            
            // disconnect gracefully
            if (this.device && this.device.gatt.connected) {
                this.device.gatt.disconnect();
            }
            return true;
        } catch (error: any) {
            console.error("Bluetooth Print Error:", error);
            throw new Error(error.message || "Gagal mencetak struk.");
        }
    }
}
