package com.meenuin.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {

    private PrinterBridge printerBridge;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Expose JS interface for thermal printing
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            printerBridge = new PrinterBridge(this);
            printerBridge.setWebView(webView);           // enable JS callbacks
            webView.addJavascriptInterface(printerBridge, "Android");
        }
    }
}
