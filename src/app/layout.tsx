import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oaktix.com.ng"),
  title: "OakTix - Complete Event Ticketing Platform",
  description: "Nigeria's home for unforgettable events. Discover concerts, conferences, festivals, and more. Buy tickets in seconds, walk in with a QR code.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/logo-footer.png",
  },
  openGraph: {
    title: "OakTix - Complete Event Ticketing Platform",
    description: "Nigeria's home for unforgettable events. Discover concerts, conferences, festivals, and more. Buy tickets in seconds, walk in with a QR code.",
    url: "https://oaktix.com.ng",
    siteName: "OakTix",
    images: [
      {
        url: "/logo-header.png",
        width: 1200,
        height: 630,
        alt: "OakTix Logo",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OakTix - Complete Event Ticketing Platform",
    description: "Nigeria's home for unforgettable events. Discover concerts, conferences, festivals, and more. Buy tickets in seconds, walk in with a QR code.",
    images: ["/logo-header.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

