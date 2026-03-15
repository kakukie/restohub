package com.meenuin.app;

import android.content.Context;
import android.webkit.JavascriptInterface;

/**
 * Exposes a minimal JS bridge: window.Android.printReceipt(orderJson, restaurantJson)
 */
public class PrinterBridge {
    private final Context context;
    private final ThermalPrinter printer;

    public PrinterBridge(Context ctx) {
        this.context = ctx;
        this.printer = new ThermalPrinter();
    }

    @JavascriptInterface
    public void printReceipt(String orderData, String restaurantData) {
        try {
            printer.print(orderData, restaurantData);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
