"use client"

import { useState, useEffect } from "react"

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1] as const

interface DenominationCounterProps {
  onChange: (total: number) => void
}

export function DenominationCounter({ onChange }: DenominationCounterProps) {
  const [counts, setCounts] = useState<Record<number, string>>(
    Object.fromEntries(DENOMINATIONS.map(d => [d, ""]))
  )

  const total = DENOMINATIONS.reduce(
    (sum, d) => sum + d * (parseInt(counts[d] ?? "0") || 0),
    0
  )

  useEffect(() => { onChange(total) }, [total, onChange])

  function setCount(denom: number, val: string) {
    if (val !== "" && !/^\d+$/.test(val)) return
    setCounts(prev => ({ ...prev, [denom]: val }))
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-x-2 text-xs font-medium text-[var(--color-text-muted)] mb-1">
        <span>Denom</span>
        <span className="text-center">Count</span>
        <span className="text-right">Amount</span>
      </div>
      {DENOMINATIONS.map(d => {
        const count = parseInt(counts[d] ?? "0") || 0
        const subtotal = d * count
        return (
          <div key={d} className="grid grid-cols-3 items-center gap-x-2">
            <span className="font-mono text-xs text-[var(--color-text-muted)]">
              {d >= 1000 ? `${d / 1000}K` : d}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={counts[d]}
              onChange={e => setCount(d, e.target.value)}
              placeholder="0"
              className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-center font-mono text-xs focus:border-[var(--color-primary)] focus:outline-none"
            />
            <span className="text-right font-mono text-xs text-[var(--color-text)]">
              {subtotal > 0 ? subtotal.toLocaleString() : "—"}
            </span>
          </div>
        )
      })}
      <div className="border-t border-[var(--color-border)] pt-1.5 flex justify-between">
        <span className="text-xs font-semibold text-[var(--color-text)]">Total</span>
        <span className="font-mono text-xs font-bold text-[var(--color-primary)]">
          KES {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
