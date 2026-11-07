import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata, Viewport } from "next"
import { AppShell } from "@/components/app-shell"
import { RuntimeBranding } from "@/components/runtime-branding"
import { ThemeProvider } from "@/components/theme-provider"
import { WalletProvider } from "@/components/wallet-provider"
import { Toaster } from "@/components/ui/sonner"

const geist = Geist({ variable: "--font-geist" })
const geistMono = Geist_Mono({ variable: "--font-geist-mono" })
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

export const metadata: Metadata = {
title: { default: "HOOKLABS — Hook Intelligence & $HOOKLB Ecosystem", template: "%s · HOOKLABS" },
 description: "Explore HOOKLABS hook intelligence, the proposed $HOOKLB ecosystem token, roadmap, and community resources.",
  generator: "v0.app",
  icons: { icon: "/images/hooklab-logo.png", apple: "/images/hooklab-logo.png" },
}

export const viewport: Viewport = { colorScheme: "dark", themeColor: "#070908", userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark" style={{ backgroundColor: "#070908" }}><body className={`${geist.variable} ${geistMono.variable} antialiased`}><ThemeProvider><WalletProvider><TooltipProvider><RuntimeBranding/><AppShell>{children}</AppShell><Toaster richColors /></TooltipProvider></WalletProvider></ThemeProvider>{process.env.NODE_ENV === "production" && <Analytics />}</body></html>
}
