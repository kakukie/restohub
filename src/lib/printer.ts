export const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb' // Standard BLE UUID for many printers, or generic
export const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'

export const connectToPrinter = async () => {
    try {
        const device = await (navigator as any).bluetooth.requestDevice({
            filters: [{ services: [PRINTER_SERVICE_UUID] }],
            optionalServices: [PRINTER_SERVICE_UUID]
        })

        const server = await device.gatt.connect()
        const service = await server.getPrimaryService(PRINTER_SERVICE_UUID)
        const characteristic = await service.getCharacteristic(PRINTER_CHARACTERISTIC_UUID)

        return { device, characteristic }
    } catch (error) {
        console.error('Printer Connection Error:', error)
        throw error
    }
}

// Simple ESC/POS Encoder
export const encodeESC = (text: string) => {
    const encoder = new TextEncoder()
    return encoder.encode(text)
}

export const printReceipt = async (characteristic: any, order: any, restaurantName: string) => {
    const commands = []

    // Helpers
    const text = (str: string) => commands.push(encodeESC(str + '\n'))
    const center = () => commands.push(new Uint8Array([0x1B, 0x61, 0x01]))
    const left = () => commands.push(new Uint8Array([0x1B, 0x61, 0x00]))
    const boldOn = () => commands.push(new Uint8Array([0x1B, 0x45, 0x01]))
    const boldOff = () => commands.push(new Uint8Array([0x1B, 0x45, 0x00]))
    const bigOn = () => commands.push(new Uint8Array([0x1D, 0x21, 0x11])) // Double width/height
    const bigOff = () => commands.push(new Uint8Array([0x1D, 0x21, 0x00]))
    const cut = () => commands.push(new Uint8Array([0x1D, 0x56, 0x41, 0x00])) // Cut

    // Header
    center()
    bigOn()
    text(restaurantName)
    bigOff()
    text('--------------------------------')

    // Order Info
    left()
    text(`Order #${order.orderNumber}`)
    text(`Date: ${new Date(order.createdAt).toLocaleString()}`)
    text(`Table: ${order.tableNumber || 'Takeaway'}`)
    text(`Cust: ${order.customerName}`)
    text('--------------------------------')

    // Items
    order.items.forEach((item: any) => {
        let line = `${item.quantity}x ${item.menuItemName}`
        // Simple wrapping logic could go here, for now truncate or let wrap
        text(line)
        if (item.notes) text(`   Note: ${item.notes}`)
        const price = new Intl.NumberFormat('id-ID').format(item.price * item.quantity)
        text(price.padStart(32)) // Right align price loosely
    })

    text('--------------------------------')
    boldOn()
    const total = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.totalAmount)
    text(`TOTAL: ${total}`)
    boldOff()
    text('--------------------------------')

    center()
    text('Thank You!')
    text('\n\n\n') // Feed

    // Send chunks
    for (const cmd of commands) {
        await characteristic.writeValue(cmd)
    }
}
