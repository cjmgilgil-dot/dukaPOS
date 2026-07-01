"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Layers } from "lucide-react"
import { openShift } from "@/app/(pos)/pos/actions"
import { toast } from "sonner"
import type { ActiveShift } from "@/lib/shift/types"

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000]

interface ShiftOpenProps {
  cashierName: string
  branchName: string
  onOpen: (shift: ActiveShift) => void
  onSkip: () => void
}

export function ShiftOpen({ cashierName, branchName, onOpen, onSkip }: ShiftOpenProps) {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const floatValue = parseFloat(amount) || 0

  async function handleOpen() {
    if (loading) return
    setLoading(true)
    const result = await openShift(floatValue)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Shift opened")
    onOpen(result.data)
    router.refresh() // update layout ShiftIndicator
  }

  const today = new Date().toLocaleDateString("en-KE", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="flex h-full items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
            <Layers className="h-7 w-7 text-[var(--color-primary)]" />
          </div>
        </div>

        <h2 className="mb-1 text-center text-xl font-bold text-[var(--color-text)]">
          Start Your Shift
        </h2>

        {/* Info */}
        <div className="mb-6 space-y-0.5 text-center text-sm text-[var(--color-text-muted)]">
          <p>{cashierName}</p>
          <p>{branchName}</p>
          <p>{today}</p>
        </div>

        {/* Float input */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Opening Float (cash in drawer)
          </label>
          <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 focus-within:border-[var(--color-primary)]">
            <span className="shrink-0 text-sm font-medium text-[var(--color-text-muted)]">KES</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent py-3 pl-2 font-mono text-right text-lg font-semibold text-[var(--color-text)] focus:outline-none"
            />
          </div>
        </div>

        {/* Quick amounts */}
        <div className="mb-6 grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map(q => (
            <button
              key={q}
              onClick={() => setAmount(String(q))}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors"
            >
              {q >= 1000 ? `${q / 1000}K` : q}
            </button>
          ))}
        </div>

        {/* Open button */}
        <button
          onClick={handleOpen}
          disabled={loading}
          className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
        >
          {loading ? "Opening…" : "Open Shift"}
        </button>

        {/* Skip */}
        <p className="mt-4 text-center">
          <button
            onClick={onSkip}
            className="text-xs text-[var(--color-text-muted)] underline hover:text-[var(--color-text)] transition-colors"
          >
            Skip for now
          </button>
        </p>
      </div>
    </div>
  )
}
