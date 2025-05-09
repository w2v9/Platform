import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Arabic fonts
const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-sans-arabic",
  subsets: ["arabic"],
});

const notoSansArabicBold = Noto_Sans_Arabic({
  variable: "--font-noto-sans-arabic-bold",
  subsets: ["arabic"],
  weight: "700",
});


export const metadata: Metadata = {
  title: "Quiz app - AzoozGAT Platform",
  description: "A quiz app for AzoozGAT platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} ${notoSansArabicBold.variable} antialiased`}
      >
        <main className="flex flex-col min-h-screen justify-center" >
          <Navbar />
          {children}
          <Footer />
        </main>
      </body>
    </html>
  );
}
