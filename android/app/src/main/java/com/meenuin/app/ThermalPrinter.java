package com.meenuin.app;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.UUID;

/**
 * Minimal ESC/POS text sender for bonded Bluetooth thermal printers.
 */
public class ThermalPrinter {
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    public void print(String orderJson, String restaurantJson) throws Exception {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            throw new Exception("Bluetooth tidak aktif atau tidak tersedia");
        }

        BluetoothDevice target = pickPrinter(adapter.getBondedDevices());
        if (target == null) {
            throw new Exception("Printer thermal belum dipair");
        }

        BluetoothSocket socket = target.createRfcommSocketToServiceRecord(SPP_UUID);
        socket.connect();

        OutputStream os = socket.getOutputStream();
        byte[] payload = buildReceipt(orderJson, restaurantJson);
        os.write(payload);
        os.flush();

        os.close();
        socket.close();
    }

    private BluetoothDevice pickPrinter(Set<BluetoothDevice> bonded) {
        if (bonded == null) return null;
        for (BluetoothDevice d : bonded) {
            String name = d.getName() != null ? d.getName() : "";
            if (name.contains("MPT") || name.contains("PT") || name.contains("Blue") || name.contains("Inner")) {
                return d;
            }
        }
        // fallback: first bonded device
        return bonded.iterator().hasNext() ? bonded.iterator().next() : null;
    }

    private byte[] buildReceipt(String orderJson, String restaurantJson) {
        StringBuilder sb = new StringBuilder();
        try {
            JSONObject resto = new JSONObject(restaurantJson);
            JSONObject order = new JSONObject(orderJson);

            sb.append(center(resto.optString("name", "Restaurant"))).append("\n");
            if (resto.has("address")) sb.append(center(resto.optString("address"))).append("\n");
            if (resto.has("phone")) sb.append(center(resto.optString("phone"))).append("\n");
            sb.append("--------------------------------\n");

            sb.append("No: #").append(order.optString("orderNumber")).append("\n");
            sb.append("Tgl: ").append(order.optString("createdAt")).append("\n");
            sb.append("Cust: ").append(order.optString("customerName", "Guest")).append("\n");
            sb.append("Tipe: ").append(order.optString("tableNumber", "").isEmpty() ? "Takeaway" : "Meja " + order.optString("tableNumber")).append("\n");
            sb.append("--------------------------------\n");

            if (order.has("items")) {
                JSONArray items = order.getJSONArray("items");
                for (int i = 0; i < items.length(); i++) {
                    JSONObject it = items.getJSONObject(i);
                    int qty = it.optInt("quantity", 1);
                    double price = it.optDouble("price", 0);
                    double total = qty * price;
                    sb.append(qty).append("x ").append(it.optString("menuItemName")).append("\n");
                    sb.append("      Rp ").append(String.format("%,.0f", total)).append("\n");
                    if (it.has("notes")) {
                        sb.append("      catatan: ").append(it.optString("notes")).append("\n");
                    }
                }
            }

            sb.append("--------------------------------\n");
            sb.append("TOTAL: Rp ").append(String.format("%,.0f", order.optDouble("totalAmount", 0))).append("\n");
            sb.append("--------------------------------\n");
            sb.append(center("Terima kasih atas kunjungan Anda!")).append("\n");
            sb.append(center("Layanan Menu Digital oleh Meenuin")).append("\n\n\n");
        } catch (Exception e) {
            Log.e("ThermalPrinter", "Parse/format error", e);
            sb.append("Print error: ").append(e.getMessage());
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String center(String text) {
        if (text == null) return "";
        if (text.length() >= 32) return text;
        int left = (32 - text.length()) / 2;
        return String.format("%" + (left + text.length()) + "s", text);
    }
}
