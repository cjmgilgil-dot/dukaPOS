"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface CashPaymentProps {
  remaining: number
  onApply: (amount: number) => void
}

export function CashPayment({ remaining, onApply }: CashPaymentProps) {
  const [amount, setAmount] = useState("")

  const quickAmounts = [
    remaining,
    Math.ceil(remaining / 500) * 500,
    Math.ceil(remaining / 1000) * 1000,
    Math.ceil(remaining / 2000) * 2000,
  ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i).slice(0, 4)

  const parsedAmount = parseFloat(amount) || 0
  const change = Math.max(0, parsedAmount - remaining)

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
          Cash Tendered
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5">
          <span className="text-sm text-[var(--color-text-muted)]">KES</span>
          <input
            autoFocus
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={remaining.toFixed(0)}
            className="flex-1 bg-transparent text-lg font-semibold text-[var(--color-text)] focus:outline-none"
          />
        </div>
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-2 gap-2">
        {quickAmounts.map(amt => (
          <button
            key={amt}
            onClick={() => { setAmount(String(amt)); }}
            className={cn(
              "rounded-xl border py-2.5 text-sm font-medium transition-colors",
              parsedAmount === amt
                ? "border-[var(--color-primary)] bg-orange-500/10 text-[var(--color-primary)]"
                : "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-orange-500/5"
            )}
          >
            KES {amt.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Change */}
      {parsedAmount >= remaining && (
        <div className="rounded-xl bg-[var(--color-success)]/10 px-4 py-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Change</span>
            <span className="font-mono font-bold text-[var(--color-success)]">
              KES {change.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => onApply(parsedAmount > 0 ? parsedAmount : remaining)}
        disabled={parsedAmount > 0 && parsedAmount < remaining}
        className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {parsedAmount <= 0
          ? `Apply KES ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          : `Apply KES ${parsedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
      </button>
    </div>
  )
}
