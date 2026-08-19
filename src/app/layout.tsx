import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TMK — Sistem Billing & Manajemen",
    template: "%s | TMK",
  },
  description:
    "Sistem billing profesional untuk TMK — CCTV, Access Point, Instalasi Listrik, Penarikan Kabel, Cleaning AC",
  keywords: ["CCTV", "billing", "invoice", "instalasi listrik", "TMK"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
