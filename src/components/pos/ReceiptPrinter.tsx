"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import { toast } from "sonner"
import { printReceipt } from "@/lib/receipt/print-manager"
import { cn } from "@/lib/utils"

interface ReceiptPrinterProps {
  saleId: string
  openDrawer?: boolean
  variant?: "icon" | "button"
  className?: string
  label?: string
}

export function ReceiptPrinter({
  saleId,
  openDrawer = false,
  variant = "button",
  className,
  label = "Print Receipt",
}: ReceiptPrinterProps) {
  const [loading, setLoading] = useState(false)

  async function handlePrint() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/receipt/${saleId}`)
      if (!res.ok) throw new Error("Could not load receipt")
      const html = await res.text()
      const result = await printReceipt(html, { openDrawer })
      if (result.source === "local-service") {
        toast.success("Sent to printer")
      }
    } catch (err) {
      toast.error("Print failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handlePrint}
        disabled={loading}
        title={label}
        className={cn(
          "flex items-center justify-center rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50",
          className
        )}
      >
        <Printer className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50",
        className
      )}
    >
      <Printer className="h-4 w-4 shrink-0" />
      {loading ? "Printing…" : label}
    </button>
  )
}
