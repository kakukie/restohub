# Preserve JavaScript Interface for PrinterBridge
-keepclassmembers class com.meenuin.app.PrinterBridge {
   @android.webkit.JavascriptInterface <methods>;
}

# Preserve ThermalPrinter and its callback for runtime access
-keep class com.meenuin.app.ThermalPrinter { *; }
-keep interface com.meenuin.app.ThermalPrinter$PrintCallback { *; }

