import type { Metadata } from "next"
import { SessionProvider } from "@/components/providers/SessionProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "DukaPOS",
  description: "Point of Sale terminal for hardware & electronics shops",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
