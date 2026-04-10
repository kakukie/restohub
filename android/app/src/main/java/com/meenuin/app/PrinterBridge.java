package com.meenuin.app;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

/**
 * Exposes JS bridge:
 *   window.Android.printReceipt(orderJson, restaurantJson, callbackId)
 *   window.Android.checkPrinterAvailable()
 *
 * Callbacks are delivered back to JS via:
 *   window.__printerCallback(callbackId, success, message)
 */
public class PrinterBridge {
    private final Context context;
    private final ThermalPrinter printer;
    private WebView webView;

    public PrinterBridge(Context ctx) {
        this.context = ctx;
        this.printer = new ThermalPrinter();
    }

    /** Call this after WebView is ready to enable JS callbacks */
    public void setWebView(WebView wv) {
        this.webView = wv;
    }

    /**
     * Print a receipt. callbackId is echoed back in the JS callback.
     * JS usage:
     *   window.Android.printReceipt(JSON.stringify(order), JSON.stringify(restaurant), 'cb_1')
     */
    @JavascriptInterface
    public void printReceipt(String orderData, String restaurantData, String callbackId) {
        printer.print(orderData, restaurantData, new ThermalPrinter.PrintCallback() {
            @Override
            public void onSuccess() {
                invokeJsCallback(callbackId, true, "Struk berhasil dicetak");
            }

            @Override
            public void onError(String message) {
                invokeJsCallback(callbackId, false, message);
            }
        });
    }

    /**
     * Check if a paired Bluetooth printer is available.
     * Returns JSON string: {"available": true/false, "printerName": "..."}
     */
    @JavascriptInterface
    public String checkPrinterAvailable() {
        try {
            android.bluetooth.BluetoothAdapter adapter = android.bluetooth.BluetoothAdapter.getDefaultAdapter();
            if (adapter == null || !adapter.isEnabled()) {
                return "{\"available\":false,\"reason\":\"bluetooth_off\"}";
            }
            java.util.Set<android.bluetooth.BluetoothDevice> bonded = adapter.getBondedDevices();
            if (bonded == null || bonded.isEmpty()) {
                return "{\"available\":false,\"reason\":\"no_paired_device\"}";
            }
            // Check for known printer names
            String[] printerPrefixes = {
                "MPT", "PT-", "Blue", "Inner", "Printer", "POS", "RPP", "MTP",
                "TSC", "XP", "ZJ", "BT", "GP", "TBP", "58", "80"
            };
            for (android.bluetooth.BluetoothDevice d : bonded) {
                String name = d.getName() != null ? d.getName().toUpperCase() : "";
                for (String prefix : printerPrefixes) {
                    if (name.contains(prefix.toUpperCase())) {
                        return "{\"available\":true,\"printerName\":\"" + escapeJson(d.getName()) + "\"}";
                    }
                }
            }
            // Fallback: first bonded device
            android.bluetooth.BluetoothDevice first = bonded.iterator().next();
            return "{\"available\":true,\"printerName\":\"" + escapeJson(first.getName()) + "\",\"fallback\":true}";
        } catch (Exception e) {
            return "{\"available\":false,\"reason\":\"" + escapeJson(e.getMessage()) + "\"}";
        }
    }

    private void invokeJsCallback(String callbackId, boolean success, String message) {
        if (webView == null) return;
        String escapedMsg = escapeJson(message);
        String js = "window.__printerCallback && window.__printerCallback('" + callbackId + "'," + success + ",'" + escapedMsg + "')";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("'", "\\'").replace("\"", "\\\"").replace("\n", "\\n");
    }
}
