import { registerPlugin } from '@capacitor/core'

export interface ThermalPrinterPlugin {
  /**
   * Send receipt data to native Android thermal printer bridge.
   * orderData and restaurantData must be JSON stringified objects.
   */
  printReceipt(options: { orderData: string; restaurantData: string }): Promise<void>
}

export const ThermalPrinter = registerPlugin<ThermalPrinterPlugin>('ThermalPrinter', {
  web: {
    // Fallback stub for web; always reject so caller can try Web Bluetooth or window.print
    async printReceipt() {
      return Promise.reject(new Error('Native printer not available on web'))
    },
  },
})
