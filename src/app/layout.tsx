import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/common/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meenuin - Digital Restaurant Platform",
  description: "Comprehensive SaaS platform for modern restaurants. Manage menus, process orders, and delight customers with QRIS & E-wallet payments.",
  keywords: ["Meenuin", "Restaurant", "SaaS", "Menu Management", "QRIS", "E-wallet", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui"],
  authors: [{ name: "Meenuin Team" }],
  icons: {
    icon: "/favicon.png?v=5",
  },
  openGraph: {
    title: "Meenuin - Digital Restaurant Platform",
    description: "Comprehensive restaurant management platform for modern businesses",
    url: "https://meenuin.biz.id",
    siteName: "Meenuin",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meenuin - Digital Restaurant Platform",
    description: "Modern restaurant management platform",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meenuin Admin",
  },
  formatDetection: {
    telephone: false,
  },
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
