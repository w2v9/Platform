import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Arabic } from "next/font/google";
import "../(default)/globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({
    variable: "--font-noto-sans-arabic",
    subsets: ["arabic"],
});

export default function QuizLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} antialiased`}>
                <main className="flex-grow container mx-auto p-4">
                    {children}
                </main>
            </body>
        </html>
    );
}