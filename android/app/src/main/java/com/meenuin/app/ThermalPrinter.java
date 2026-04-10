package com.meenuin.app;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Minimal ESC/POS text sender for bonded Bluetooth thermal printers.
 * Runs on background thread to avoid NetworkOnMainThreadException.
 */
public class ThermalPrinter {
    private static final String TAG = "ThermalPrinter";
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    public interface PrintCallback {
        void onSuccess();
        void onError(String message);
    }

    /**
     * Print receipt asynchronously (background thread).
     * Calls callback on completion.
     */
    public void print(String orderJson, String restaurantJson, PrintCallback callback) {
        executor.execute(() -> {
            BluetoothSocket socket = null;
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null) {
                    if (callback != null) callback.onError("Perangkat tidak mendukung Bluetooth");
                    return;
                }
                if (!adapter.isEnabled()) {
                    if (callback != null) callback.onError("Bluetooth tidak aktif. Aktifkan Bluetooth terlebih dahulu.");
                    return;
                }

                Set<BluetoothDevice> bonded = adapter.getBondedDevices();
                BluetoothDevice target = pickPrinter(bonded);
                if (target == null) {
                    if (callback != null) callback.onError("Printer thermal belum di-pair. Pair printer Bluetooth terlebih dahulu di Pengaturan Bluetooth.");
                    return;
                }

                Log.d(TAG, "Connecting to printer: " + target.getName());
                socket = target.createRfcommSocketToServiceRecord(SPP_UUID);

                // Cancel discovery to avoid interference before connect
                adapter.cancelDiscovery();

                socket.connect();

                OutputStream os = socket.getOutputStream();
                byte[] payload = buildReceipt(orderJson, restaurantJson);
                os.write(payload);
                os.flush();

                Log.d(TAG, "Print success: " + payload.length + " bytes sent");
                if (callback != null) callback.onSuccess();

            } catch (IOException e) {
                Log.e(TAG, "Bluetooth connect/write error", e);
                if (callback != null) callback.onError("Gagal koneksi ke printer: " + e.getMessage());
            } catch (Exception e) {
                Log.e(TAG, "Print error", e);
                if (callback != null) callback.onError("Error cetak: " + e.getMessage());
            } finally {
                if (socket != null) {
                    try { socket.close(); } catch (IOException ignored) {}
                }
            }
        });
    }

    /**
     * Pick printer from bonded devices.
     * Priority: known thermal printer name prefixes → first bonded device.
     */
    private BluetoothDevice pickPrinter(Set<BluetoothDevice> bonded) {
        if (bonded == null || bonded.isEmpty()) return null;

        String[] printerPrefixes = {
            "MPT", "PT-", "Blue", "Inner", "Printer", "POS", "RPP", "MTP",
            "TSC", "XP", "ZJ", "BT", "GP", "TBP", "58", "80"
        };

        for (BluetoothDevice d : bonded) {
            String name = d.getName() != null ? d.getName().toUpperCase() : "";
            for (String prefix : printerPrefixes) {
                if (name.startsWith(prefix.toUpperCase()) || name.contains(prefix.toUpperCase())) {
                    Log.d(TAG, "Found printer by name: " + d.getName());
                    return d;
                }
            }
        }

        // fallback: first bonded device
        BluetoothDevice first = bonded.iterator().next();
        Log.d(TAG, "Using first bonded device as fallback: " + first.getName());
        return first;
    }

    private byte[] buildReceipt(String orderJson, String restaurantJson) {
        // ESC/POS byte helpers
        byte[] ESC_INIT    = {0x1B, 0x40};           // Initialize printer
        byte[] ALIGN_CTR   = {0x1B, 0x61, 0x01};     // Center align
        byte[] ALIGN_LEFT  = {0x1B, 0x61, 0x00};     // Left align
        byte[] ALIGN_RIGHT = {0x1B, 0x61, 0x02};     // Right align
        byte[] BOLD_ON     = {0x1B, 0x45, 0x01};     // Bold on
        byte[] BOLD_OFF    = {0x1B, 0x45, 0x00};     // Bold off
        byte[] BIG_ON      = {0x1D, 0x21, 0x11};     // Double width & height
        byte[] BIG_OFF     = {0x1D, 0x21, 0x00};     // Normal size
        byte[] CUT         = {0x1D, 0x56, 0x41, 0x00}; // Paper cut
        byte[] LF          = {0x0A};                  // Line feed

        StringBuilder sb = new StringBuilder();
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();

        try {
            JSONObject resto = new JSONObject(restaurantJson);
            JSONObject order = new JSONObject(orderJson);

            write(out, ESC_INIT);
            write(out, ALIGN_CTR);
            write(out, BIG_ON);
            writeln(out, resto.optString("name", "Restaurant"));
            write(out, BIG_OFF);
            if (resto.has("address")) writeln(out, resto.optString("address"));
            if (resto.has("phone"))   writeln(out, resto.optString("phone"));
            writeln(out, "--------------------------------");

            write(out, ALIGN_LEFT);
            writeln(out, "No: #" + order.optString("orderNumber"));
            writeln(out, "Tgl: " + order.optString("createdAt"));
            writeln(out, "Cust: " + order.optString("customerName", "Guest"));
            String tipe = order.optString("tableNumber", "").isEmpty()
                ? "Takeaway" : "Meja " + order.optString("tableNumber");
            writeln(out, "Tipe: " + tipe);
            writeln(out, "--------------------------------");

            if (order.has("items")) {
                JSONArray items = order.getJSONArray("items");
                for (int i = 0; i < items.length(); i++) {
                    JSONObject it = items.getJSONObject(i);
                    int qty = it.optInt("quantity", 1);
                    double price = it.optDouble("price", 0);
                    double total = qty * price;
                    writeln(out, qty + "x " + it.optString("menuItemName", it.optString("name", "-")));
                    // right-align price
                    write(out, ALIGN_RIGHT);
                    writeln(out, "Rp " + String.format("%,.0f", total));
                    write(out, ALIGN_LEFT);
                    if (it.has("notes") && !it.optString("notes").isEmpty()) {
                        writeln(out, "  catatan: " + it.optString("notes"));
                    }
                }
            }

            writeln(out, "--------------------------------");
            write(out, ALIGN_RIGHT);
            write(out, BOLD_ON);
            writeln(out, "TOTAL: Rp " + String.format("%,.0f", order.optDouble("totalAmount", 0)));
            write(out, BOLD_OFF);
            write(out, ALIGN_CTR);
            writeln(out, "--------------------------------");
            writeln(out, "Terima kasih atas kunjungan Anda!");
            writeln(out, "Layanan Menu Digital oleh Meenuin");

            // Feed & cut
            write(out, LF);
            write(out, LF);
            write(out, LF);
            write(out, CUT);

        } catch (Exception e) {
            Log.e(TAG, "Receipt build error", e);
            writeln(out, "Error: " + e.getMessage());
        }

        return out.toByteArray();
    }

    private void write(java.io.ByteArrayOutputStream out, byte[] data) {
        try { out.write(data); } catch (Exception ignored) {}
    }

    private void writeln(java.io.ByteArrayOutputStream out, String text) {
        try {
            out.write(text.getBytes(StandardCharsets.UTF_8));
            out.write(0x0A); // LF
        } catch (Exception ignored) {}
    }
}
