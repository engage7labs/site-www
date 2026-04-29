import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner";
import { DevEnvironmentMarker } from "@/components/shared/dev-environment-marker";
import { config } from "@/lib/config";
import { isDevEnvironment } from "@/lib/env";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import type React from "react";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const titlePrefix = isDevEnvironment ? "[DEV] " : "";
const baseUrl = config.siteUrl;

export const metadata: Metadata = {
  title: {
    default: `${titlePrefix}Engage7 \u2014 See What Your Body Is Telling You`,
    template: `${titlePrefix}%s | Engage7`,
  },
  description:
    "Turn your wearable data into clear insights about sleep, recovery, and movement. Based on your own patterns, not averages.",
  keywords: [
    "wearable data",
    "Apple Health",
    "health insights",
    "sleep analysis",
    "recovery patterns",
    "heart rate",
    "activity tracking",
    "data privacy",
  ],
  authors: [{ name: "Engage7 Labs" }],
  creator: "Engage7 Labs",
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: baseUrl,
    siteName: "Engage7",
    title: "Engage7 — See What Your Body Is Telling You",
    description:
      "Turn your wearable data into clear insights about sleep, recovery, and movement. Based on your own patterns, not averages.",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Engage7 — Understanding patterns in your data",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Engage7 — See What Your Body Is Telling You",
    description:
      "Turn your wearable data into clear insights about sleep, recovery, and movement. Based on your own patterns, not averages.",
    images: ["/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/engage7-logo-180x180.png", sizes: "180x180" }],
  },
  // Sprint 35.0: PWA manifest
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Engage7",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Engage7",
              description:
                "Turn your wearable data into clear insights about sleep, recovery, and movement. Based on your own patterns, not averages.",
              url: "https://www.engage7.ie",
              applicationCategory: "HealthApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
              },
              author: {
                "@type": "Organization",
                name: "Engage7 Labs",
                url: "https://www.engage7.ie",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <AppThemeProvider>
          <LocaleProvider>
            <PostHogProvider>{children}</PostHogProvider>
          </LocaleProvider>
        </AppThemeProvider>
        <CookieConsentBanner />
        <DevEnvironmentMarker />
        <Analytics />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
