import { AppThemeProvider } from "@/components/providers/app-theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
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
    "Engage7 transforms raw Apple Health data into deterministic, explainable insights built from your physiological baseline. No AI black boxes. Your data stays yours.",
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
  metadataBase: new URL("https://engage7.com"),
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: "https://engage7.com",
    siteName: "Engage7",
    title: "Engage7 - Understand Your Wearable Data Clearly",
    description:
      "Transform raw health signals into deterministic insights built from your physiological baseline. No AI black boxes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Engage7 - Deterministic Wearable Data Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Engage7 - Understand Your Wearable Data Clearly",
    description:
      "Transform raw health signals into deterministic insights built from your physiological baseline.",
    images: ["/og-image.png"],
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
                "Deterministic wearable data analysis built from your physiological baseline.",
              url: "https://engage7.com",
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
                url: "https://engage7.com",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <AppThemeProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </AppThemeProvider>
        <Analytics />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
