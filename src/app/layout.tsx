import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "DataScry | 100% Offline PDF, Word & Image Tools",
  description: "Manajemen dokumen PDF, Word, dan alat optimasi privasi foto yang memproses segala jenis arsip secara instan, aman, 100% di browser Anda tanpa unggah API sedikit pun. Fitur unggulan iLovePDF kini di genggaman Anda secara luring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col overflow-x-hidden`}
      >
        <div className="flex-1 flex flex-col w-full h-full">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
