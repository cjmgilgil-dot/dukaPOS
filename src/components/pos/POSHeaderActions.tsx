"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { ReceiptPrinter } from "@/components/pos/ReceiptPrinter"

export function POSHeaderActions() {
  const [lastReceiptId, setLastReceiptId] = useState<string | null>(null)

  useEffect(() => {
    try {
      setLastReceiptId(localStorage.getItem("dukapos:lastReceiptSaleId"))
    } catch {}
  }, [])

  return (
    <div className="flex items-center gap-2">
      {lastReceiptId && (
        <ReceiptPrinter
          saleId={lastReceiptId}
          variant="icon"
          label="Last Receipt"
          openDrawer={false}
        />
      )}
      <button
        onClick={() => signOut({ redirectTo: "/pos" })}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)] transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Lock
      </button>
    </div>
  )
}
