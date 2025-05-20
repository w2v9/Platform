import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Arabic } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/context/authContext";

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
  title: "AzoozGAT Platform",
  description: "A platform for AzoozGAT students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>

      <main className="flex flex-col min-h-screen justify-center" >
        <Navbar />
        {children}
        <Footer />
      </main>
      <Toaster />
    </AuthProvider>
  );
}
