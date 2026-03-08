import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Engage7 - Understand Your Wearable Data",
  description:
    "Engage7 transforms raw health signals into deterministic insights built from your physiological baseline.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/engage7-logo-180x180.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased`}>
        <AppThemeProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </AppThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
