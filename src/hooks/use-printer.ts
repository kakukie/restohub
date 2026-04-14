/**
 * usePrinter — React hook for Bluetooth thermal printer integration.
 *
 * Strategy:
 *  1. Native Android APK  → uses window.Android.printReceipt() (PrinterBridge Java bridge)
 *  2. Browser/PWA fallback → uses @capacitor-community/bluetooth-le (BLE)
 *
 * Usage:
 *   const { printReceipt, printerStatus, checkPrinter } = usePrinter()
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type PrinterStatus = 'unknown' | 'available' | 'unavailable' | 'printing' | 'error';

interface PrinterInfo {
    available: boolean;
    printerName?: string;
    reason?: string;
    fallback?: boolean;
}

interface UsePrinterReturn {
    printerStatus: PrinterStatus;
    printerName: string | null;
    isNativeAndroid: boolean;
    checkPrinter: () => Promise<PrinterInfo>;
    printReceipt: (order: any, restaurant: any) => Promise<{ success: boolean; message: string }>;
    errorMessage: string | null;
}

let callbackCounter = 0;

export function usePrinter(): UsePrinterReturn {
    const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('unknown');
    const [printerName, setPrinterName] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const isNativeAndroid = typeof window !== 'undefined' && !!(window as any).Android;

    // Register global callback handler for native Android bridge
    useEffect(() => {
        if (typeof window === 'undefined') return;

        (window as any).__printerCallback = (
            callbackId: string,
            success: boolean,
            message: string
        ) => {
            const fn = (window as any).__printerCallbacks?.[callbackId];
            if (fn) {
                fn(success, message);
                delete (window as any).__printerCallbacks[callbackId];
            }
        };

        if (!(window as any).__printerCallbacks) {
            (window as any).__printerCallbacks = {};
        }

        return () => {
            delete (window as any).__printerCallback;
        };
    }, []);

    /**
     * Check if a printer is available (paired & Bluetooth on).
     */
    const checkPrinter = useCallback(async (): Promise<PrinterInfo> => {
        if (isNativeAndroid) {
            try {
                const result = (window as any).Android.checkPrinterAvailable();
                const info: PrinterInfo = JSON.parse(result);
                if (info.available) {
                    setPrinterStatus('available');
                    setPrinterName(info.printerName || null);
                } else {
                    setPrinterStatus('unavailable');
                    setPrinterName(null);
                }
                return info;
            } catch (e: any) {
                setPrinterStatus('error');
                setErrorMessage('Tidak dapat mengecek printer: ' + e.message);
                return { available: false, reason: e.message };
            }
        }

        // BLE fallback check
        try {
            const { Capacitor } = await import('@capacitor/core');
            if (Capacitor.isNativePlatform()) {
                const { BleClient } = await import('@capacitor-community/bluetooth-le');
                await BleClient.initialize({ androidNeverForLocation: true });
                setPrinterStatus('available');
                return { available: true };
            }
        } catch { /* ignore */ }

        // Browser: check Web Bluetooth support
        if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
            setPrinterStatus('available');
            return { available: true };
        }

        setPrinterStatus('unavailable');
        return { available: false, reason: 'not_supported' };
    }, [isNativeAndroid]);

    // Auto-check on mount
    useEffect(() => {
        checkPrinter();
    }, [checkPrinter]);

    /**
     * Print a receipt.
     * Returns {success, message}.
     */
    const printReceipt = useCallback(async (
        order: any,
        restaurant: any
    ): Promise<{ success: boolean; message: string }> => {
        setErrorMessage(null);
        setPrinterStatus('printing');

        // === Path 1: Native Android bridge ===
        if (isNativeAndroid) {
            return new Promise((resolve) => {
                const callbackId = 'cb_' + (++callbackCounter);

                // Register callback
                (window as any).__printerCallbacks[callbackId] = (
                    success: boolean,
                    message: string
                ) => {
                    if (success) {
                        setPrinterStatus('available');
                        resolve({ success: true, message });
                    } else {
                        setPrinterStatus('error');
                        setErrorMessage(message);
                        resolve({ success: false, message });
                    }
                };

                // Format createdAt using Asia/Jakarta timezone
                const formattedOrder = {
                    ...order,
                    createdAt: new Date(order.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                };

                // Invoke bridge (runs on background thread in Java)
                try {
                    (window as any).Android.printReceipt(
                        JSON.stringify(formattedOrder),
                        JSON.stringify(restaurant),
                        callbackId
                    );
                } catch (e: any) {
                    // Fallback for old bridge without callbackId param
                    try {
                        (window as any).Android.printReceipt(
                            JSON.stringify(formattedOrder),
                            JSON.stringify(restaurant)
                        );

                        // Old bridge has no callback, assume success after 2s
                        setTimeout(() => {
                            delete (window as any).__printerCallbacks[callbackId];
                            setPrinterStatus('available');
                            resolve({ success: true, message: 'Cetak selesai' });
                        }, 2000);
                    } catch (e2: any) {
                        delete (window as any).__printerCallbacks[callbackId];
                        setPrinterStatus('error');
                        const msg = 'Gagal memanggil printer: ' + e2.message;
                        setErrorMessage(msg);
                        resolve({ success: false, message: msg });
                    }
                }

                // Timeout safety
                setTimeout(() => {
                    if ((window as any).__printerCallbacks?.[callbackId]) {
                        delete (window as any).__printerCallbacks[callbackId];
                        setPrinterStatus('error');
                        const msg = 'Printer tidak merespons (timeout 15 detik)';
                        setErrorMessage(msg);
                        resolve({ success: false, message: msg });
                    }
                }, 15000);
            });
        }

        // === Path 2: Capacitor BLE (non-Android or PWA) ===
        try {
            const { printerService } = await import('@/lib/bluetooth-printer');

            if (!printerService.isConnected) {
                // Try to auto-connect using saved printerName
                const savedName = localStorage.getItem('savedPrinterName') || undefined;
                await printerService.autoConnect(savedName);
                if (printerService.deviceName) {
                    localStorage.setItem('savedPrinterName', printerService.deviceName);
                    setPrinterName(printerService.deviceName);
                }
            }

            const formattedOrder = {
                ...order,
                createdAt: new Date(order.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
            };
            await printerService.printReceipt(formattedOrder, restaurant);
            setPrinterStatus('available');
            return { success: true, message: 'Struk berhasil dicetak' };
        } catch (e: any) {
            setPrinterStatus('error');
            const msg = e.message || 'Gagal mencetak struk';
            setErrorMessage(msg);
            return { success: false, message: msg };
        }
    }, [isNativeAndroid]);

    return {
        printerStatus,
        printerName,
        isNativeAndroid,
        checkPrinter,
        printReceipt,
        errorMessage,
    };
}
