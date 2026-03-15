package com.meenuin.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

@CapacitorPlugin(name = "ThermalPrinter")
public class ThermalPrinterPlugin extends Plugin {
    private final ThermalPrinter printer = new ThermalPrinter();

    @PluginMethod
    public void printReceipt(PluginCall call) {
        String orderData = call.getString("orderData");
        String restaurantData = call.getString("restaurantData");
        if (orderData == null || restaurantData == null) {
            call.reject("orderData dan restaurantData wajib diisi");
            return;
        }
        getBridge().executeOnThread(() -> {
            try {
                printer.print(orderData, restaurantData);
                call.resolve();
            } catch (Exception e) {
                call.reject(e.getMessage(), e);
            }
        });
    }
}
