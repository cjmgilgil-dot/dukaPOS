"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { ReceiptPrinter } from "@/components/pos/ReceiptPrinter"
import Image from "next/image"

interface SaleCompleteProps {
  saleId: string
  saleNumber: string
  total: number
  changeAmount: number
  etimsInvoiceNumber?: string
  etimsQRCode?: string
  etimsQueued?: boolean
  onReset: () => void
}

export function SaleComplete({
  saleId,
  saleNumber,
  total,
  changeAmount,
  etimsInvoiceNumber,
  etimsQRCode,
  etimsQueued,
  onReset,
}: SaleCompleteProps) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    try { localStorage.setItem("dukapos:lastReceiptSaleId", saleId) } catch {}
    const autoPrint = localStorage.getItem("dukapos:autoPrint") !== "false"
    if (autoPrint) {
      fetch(`/api/receipt/${saleId}`)
        .then(r => r.text())
        .then(html => import("@/lib/receipt/print-manager").then(m => m.printReceipt(html, { openDrawer: true })))
        .catch(() => undefined)
    }
  }, [saleId])

  // Decrement countdown every second — never call side-effects inside the updater
  useEffect(() => {
    const timer = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  // Trigger reset once countdown reaches zero
  useEffect(() => {
    if (countdown === 0) onReset()
  }, [countdown, onReset])

  return (
    <div className="flex flex-col items-center gap-5 overflow-y-auto py-8 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-success)]/15">
        <CheckCircle className="h-10 w-10 text-[var(--color-success)]" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--color-text)]">Sale Complete!</h2>
        <p className="mt-1 font-mono text-sm text-[var(--color-text-muted)]">{saleNumber}</p>
      </div>

      <div className="w-full max-w-xs space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Total</span>
          <span className="font-mono font-semibold text-[var(--color-text)]">{formatCurrency(total)}</span>
        </div>
        {changeAmount > 0 && (
          <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-sm font-bold">
            <span className="text-[var(--color-success)]">Change</span>
            <span className="font-mono text-[var(--color-success)]">{formatCurrency(changeAmount)}</span>
          </div>
        )}
      </div>

      {/* eTIMS section */}
      <div className="w-full max-w-xs rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
        {etimsInvoiceNumber && etimsQRCode ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
              <span className="text-xs font-medium text-[var(--color-success)]">KRA eTIMS</span>
            </div>
            <p className="font-mono text-xs text-[var(--color-text-muted)]">{etimsInvoiceNumber}</p>
            <div className="rounded-xl bg-white p-2">
              <Image
                src={etimsQRCode}
                alt="KRA eTIMS QR Code"
                width={120}
                height={120}
                unoptimized
              />
            </div>
            <p className="text-center text-[10px] text-[var(--color-text-muted)]">
              Scan to verify with KRA
            </p>
          </div>
        ) : etimsQueued ? (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-medium text-amber-400">eTIMS Queued</p>
              <p className="text-xs text-[var(--color-text-muted)]">Invoice will be submitted when online</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--color-text-muted)]" />
            <p className="text-xs text-[var(--color-text-muted)]">eTIMS pending...</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <ReceiptPrinter saleId={saleId} openDrawer={false} label="Reprint" />
        <button
          onClick={onReset}
          className="rounded-xl bg-[var(--color-primary)] px-8 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          New Sale
        </button>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">Auto-resetting in {countdown}s</p>
    </div>
  )
}
