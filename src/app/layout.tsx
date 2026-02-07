/**
 * Root Layout
 * -----------
 * Das Haupt-Layout der App. Enthält die Navbar und umschliesst alle Seiten.
 * Verwendet daisyUI für das Theming.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { UserProvider } from "@/context/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OMCL Inventur Tool",
  description: "Inventarverwaltung für Swissmedic OMCL nach ISO/IEC 17025:2017",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-theme="corporate">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-base-100`}
      >
        <UserProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
