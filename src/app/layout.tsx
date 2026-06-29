import type { Metadata } from "next"
import { SessionProvider } from "@/components/providers/SessionProvider"
import { Toaster } from "sonner"
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
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
            },
          }}
        />
      </body>
    </html>
  )
}
