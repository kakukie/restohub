package com.meenuin.app;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

/**
 * Exposes JS bridge:
 *   window.Android.printReceipt(orderJson, restaurantJson, callbackId)
 *   window.Android.checkPrinterAvailable()
 */
public class PrinterBridge {
    private final Context context;
    private final ThermalPrinter printer;
    private WebView webView;

    public PrinterBridge(Context ctx) {
        this.context = ctx;
        this.printer = new ThermalPrinter();
    }

    public void setWebView(WebView wv) {
        this.webView = wv;
    }

    @JavascriptInterface
    public void printReceipt(final String orderData, final String restaurantData, final String callbackId) {
        printer.print(orderData, restaurantData, new ThermalPrinter.PrintCallback() {
            @Override
            public void onSuccess() {
                invokeJsCallback(callbackId, true, "Cetak Berhasil");
            }

            @Override
            public void onError(String message) {
                invokeJsCallback(callbackId, false, message);
            }
        });
    }

    @JavascriptInterface
    public String checkPrinterAvailable() {
        try {
            android.bluetooth.BluetoothAdapter adapter = android.bluetooth.BluetoothAdapter.getDefaultAdapter();
            if (adapter == null || !adapter.isEnabled()) {
                return "{\"available\":false,\"reason\":\"bluetooth_off\"}";
            }
            
            java.util.Set<android.bluetooth.BluetoothDevice> bonded = null;
            try {
                bonded = adapter.getBondedDevices();
            } catch (SecurityException e) {
                return "{\"available\":false,\"reason\":\"no_permission\"}";
            }

            if (bonded == null || bonded.isEmpty()) {
                return "{\"available\":false,\"reason\":\"no_paired_device\"}";
            }

            return "{\"available\":true,\"count\":" + bonded.size() + "}";
        } catch (Exception e) {
            return "{\"available\":false,\"reason\":\"" + e.getMessage() + "\"}";
        }
    }

    private void invokeJsCallback(String callbackId, boolean success, String message) {
        if (webView == null) return;
        final String js = "window.__printerCallback && window.__printerCallback('" + callbackId + "'," + success + ",'" + escapeJson(message) + "')";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("'", "\\'").replace("\"", "\\\"").replace("\n", "\\n");
    }
}
