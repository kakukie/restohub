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
 * Supports Android 10+ (permissions handled in MainActivity).
 */
public class ThermalPrinter {
    private static final String TAG = "ThermalPrinter";
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    public interface PrintCallback {
        void onSuccess();
        void onError(String message);
    }

    public void print(String orderJson, String restaurantJson, PrintCallback callback) {
        executor.execute(() -> {
            BluetoothSocket socket = null;
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null) {
                    if (callback != null) callback.onError("Device tidak support Bluetooth");
                    return;
                }
                if (!adapter.isEnabled()) {
                    if (callback != null) callback.onError("Bluetooth OFF. Nyalakan Bluetooth.");
                    return;
                }

                Set<BluetoothDevice> bonded = null;
                try {
                    bonded = adapter.getBondedDevices();
                } catch (SecurityException e) {
                    if (callback != null) callback.onError("Izin Bluetooth ditolak. Berikan izin di Pengaturan App.");
                    return;
                }

                BluetoothDevice target = pickPrinter(bonded);
                if (target == null) {
                    if (callback != null) callback.onError("Printer belum di-pair. Masuk Ke Pengaturan Bluetooth HP, pilih printer thermal lalu 'Pair/Sandingkan'.");
                    return;
                }

                Log.d(TAG, "Connecting to printer: " + target.getName());
                socket = target.createInsecureRfcommSocketToServiceRecord(SPP_UUID);

                adapter.cancelDiscovery();
                socket.connect();

                OutputStream os = socket.getOutputStream();
                byte[] payload = buildReceipt(orderJson, restaurantJson);
                
                // Chunk the payload to avoid overwhelming the printer buffer
                int chunkSize = 256; // 256 bytes per chunk
                for (int i = 0; i < payload.length; i += chunkSize) {
                    int length = Math.min(chunkSize, payload.length - i);
                    os.write(payload, i, length);
                    os.flush();
                    try {
                        Thread.sleep(50); // 50ms delay between chunks
                    } catch (InterruptedException ignored) {}
                }

                Log.d(TAG, "Print success: " + payload.length + " bytes sent in chunks");
                if (callback != null) callback.onSuccess();

            } catch (IOException e) {
                Log.e(TAG, "Bluetooth connect/write error", e);
                if (callback != null) callback.onError("Gagal koneksi: " + e.getMessage());
            } catch (Exception e) {
                Log.e(TAG, "Print error", e);
                if (callback != null) callback.onError("Error: " + e.getMessage());
            } finally {
                if (socket != null) {
                    try { 
                        // Small delay to ensure hardware buffer clears
                        Thread.sleep(500); 
                    } catch (Exception ignored) {}
                    try { socket.close(); } catch (IOException ignored) {}
                }
            }
        });
    }

    private BluetoothDevice pickPrinter(Set<BluetoothDevice> bonded) {
        if (bonded == null || bonded.isEmpty()) return null;

        // Keywords common for EDC internal printers & portable thermal printers
        String[] printerPrefixes = {
            "MPT", "PT-", "Blue", "Inner", "Printer", "POS", "RPP", "MTP",
            "TSC", "XP", "ZJ", "BT", "GP", "TBP", "58", "80",
            "SUNMI", "IMIN", "PAX", "SZST", "WRE" // Added EDC specific brands
        };

        for (BluetoothDevice d : bonded) {
            String name = d.getName() != null ? d.getName().toUpperCase() : "";
            for (String prefix : printerPrefixes) {
                if (name.contains(prefix.toUpperCase())) {
                    Log.d(TAG, "Matched printer: " + d.getName());
                    return d;
                }
            }
        }

        // fallback: first bonded device if no keyword matched
        return bonded.iterator().next();
    }

    private byte[] buildReceipt(String orderJson, String restaurantJson) {
        byte[] ESC_INIT    = {0x1B, 0x40};
        byte[] ALIGN_CTR   = {0x1B, 0x61, 0x01};
        byte[] ALIGN_LEFT  = {0x1B, 0x61, 0x00};
        byte[] ALIGN_RIGHT = {0x1B, 0x61, 0x02};
        byte[] BOLD_ON     = {0x1B, 0x45, 0x01};
        byte[] BOLD_OFF    = {0x1B, 0x45, 0x00};
        byte[] BIG_ON      = {0x1D, 0x21, 0x11};
        byte[] BIG_OFF     = {0x1D, 0x21, 0x00};
        byte[] CUT         = {0x1D, 0x56, 0x41, 0x00};
        byte[] LF          = {0x0A};

        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();

        try {
            JSONObject resto = new JSONObject(restaurantJson);
            JSONObject order = new JSONObject(orderJson);

            out.write(ESC_INIT);
            out.write(ALIGN_CTR);
            out.write(BIG_ON);
            writeln(out, resto.optString("name", "Restaurant"));
            out.write(BIG_OFF);
            if (resto.has("address")) writeln(out, resto.optString("address"));
            if (resto.has("phone"))   writeln(out, resto.optString("phone"));
            writeln(out, "--------------------------------");

            out.write(ALIGN_LEFT);
            writeln(out, "No: #" + order.optString("orderNumber"));
            String createdAtStr = order.optString("createdAt");
            String formattedDate = createdAtStr;
            try {
                // Parse ISO 8601 (Prisma/JS format)
                // We use multiple formats to be safe
                java.text.SimpleDateFormat isoFormat = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US);
                isoFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                java.util.Date date = null;
                try {
                    date = isoFormat.parse(createdAtStr);
                } catch (Exception e1) {
                    java.text.SimpleDateFormat isoFormatSimple = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US);
                    isoFormatSimple.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                    date = isoFormatSimple.parse(createdAtStr);
                }
                
                if (date != null) {
                    java.text.SimpleDateFormat localFormat = new java.text.SimpleDateFormat("dd/MM/yyyy, HH.mm.ss", new java.util.Locale("id", "ID"));
                    localFormat.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Jakarta"));
                    formattedDate = localFormat.format(date);
                }
            } catch (Exception e) {
                Log.e(TAG, "Date parse error: " + e.getMessage());
            }
            writeln(out, "Tgl: " + formattedDate);
            writeln(out, "Cust: " + order.optString("customerName", "Guest"));
            writeln(out, "Bayar: " + order.optString("paymentMethod", "-"));
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
                    writeln(out, qty + "x " + it.optString("menuItemName", it.optString("name", "-")));
                    out.write(ALIGN_RIGHT);
                    writeln(out, "Rp " + String.format("%,.0f", qty * price));
                    out.write(ALIGN_LEFT);
                    if (it.has("notes") && !it.optString("notes").isEmpty()) {
                        writeln(out, "  catatan: " + it.optString("notes"));
                    }
                }
            }

            writeln(out, "--------------------------------");
            out.write(ALIGN_RIGHT);
            out.write(BOLD_ON);
            writeln(out, "TOTAL: Rp " + String.format("%,.0f", order.optDouble("totalAmount", 0)));
            out.write(BOLD_OFF);
            out.write(ALIGN_CTR);
            writeln(out, "--------------------------------");
            writeln(out, "Terima kasih atas kunjungan Anda!");
            writeln(out, "Layanan Menu Digital oleh Meenuin");

            out.write(LF);
            out.write(LF);
            out.write(LF);
            out.write(CUT);

        } catch (Exception e) {
            Log.e(TAG, "Receipt build error", e);
        }

        return out.toByteArray();
    }

    private void writeln(java.io.ByteArrayOutputStream out, String text) {
        try {
            out.write(text.getBytes(StandardCharsets.UTF_8));
            out.write(0x0A);
        } catch (Exception ignored) {}
    }
}
