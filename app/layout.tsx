import type { Metadata, Viewport } from "next"
import { Newsreader, Hanken_Grotesk, Space_Mono } from "next/font/google"
import "./globals.css"

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500"],
})

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "Centro de Innovacion Antonete - Innovacion abierta para el sector agroalimentario",
  description:
    "Cluster de innovacion abierta del sector agroalimentario. Un living lab de 170 hectareas reales sobre la historica Finca Antonete, donde empresas y startups validan tecnologia en campo.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#142a20",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${newsreader.variable} ${hankenGrotesk.variable} ${spaceMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
