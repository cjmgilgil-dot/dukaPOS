"use client"

import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface SaleCompleteProps {
  saleNumber: string
  total: number
  changeAmount: number
  onReset: () => void
}

export function SaleComplete({ saleNumber, total, changeAmount, onReset }: SaleCompleteProps) {
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); onReset(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onReset])

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
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

      <button
        onClick={onReset}
        className="rounded-xl bg-[var(--color-primary)] px-8 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        New Sale
      </button>

      <p className="text-xs text-[var(--color-text-muted)]">
        Auto-resetting in {countdown}s
      </p>
    </div>
  )
}
