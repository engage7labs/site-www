import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import type React from "react";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Engage7 - Understand Your Wearable Data",
    template: "%s | Engage7",
  },
  description:
    "From wearable signals to human-readable insights. Calm, explainable, and built for reflection.",
  keywords: [
    "wearable data analysis",
    "Apple Health",
    "health insights",
    "deterministic analysis",
    "physiological baseline",
    "heart rate variability",
    "sleep analysis",
    "health data privacy",
  ],
  authors: [{ name: "Engage7 Labs" }],
  creator: "Engage7 Labs",
  metadataBase: new URL("https://www.engage7.ie"),
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: "https://www.engage7.ie",
    siteName: "Engage7",
    title: "Engage7 — Understand Your Wearable Data",
    description:
      "From wearable signals to human-readable insights. Calm, explainable, and built for reflection.",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Engage7 — From wearable signals to human-readable insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Engage7 — Understand Your Wearable Data",
    description:
      "From wearable signals to human-readable insights. Calm, explainable, and built for reflection.",
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
                "From wearable signals to human-readable insights. Calm, explainable, and built for reflection.",
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
        <Analytics />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
