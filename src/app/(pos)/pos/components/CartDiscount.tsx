"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useCart } from "@/contexts/CartContext"
import { ManagerPinModal } from "@/components/pos/ManagerPinModal"

interface CartDiscountProps {
  isOpen: boolean
  onClose: () => void
}

const PIN_THRESHOLD = 10

export function CartDiscountModal({ isOpen, onClose }: CartDiscountProps) {
  const { cartDiscount, totals, setCartDiscount, clearCartDiscount } = useCart()
  const [type, setType] = useState<"percent" | "fixed">(cartDiscount.type)
  const [value, setValue] = useState(cartDiscount.value > 0 ? String(cartDiscount.value) : "")
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingValue, setPendingValue] = useState(0)

  function handleApply() {
    const val = parseFloat(value) || 0
    const pct = type === "percent" ? val : totals.lineSubtotal > 0 ? (val / totals.lineSubtotal) * 100 : 0
    if (pct > PIN_THRESHOLD) {
      setPendingValue(val)
      setPinOpen(true)
    } else {
      setCartDiscount(type, val)
      onClose()
    }
  }

  function handlePinSuccess(managerId: string) {
    setCartDiscount(type, pendingValue, managerId)
    setPinOpen(false)
    onClose()
  }

  function handleRemove() {
    clearCartDiscount()
    setValue("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl animate-in zoom-in-95">
          <h2 className="mb-4 font-semibold text-[var(--color-text)]">Cart Discount</h2>

          <div className="flex gap-2 mb-3">
            {(["percent", "fixed"] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors",
                  type === t
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
                )}
              >
                {t === "percent" ? "Percentage (%)" : "Fixed Amount (KES)"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 mb-4">
            <span className="text-[var(--color-text-muted)] text-sm">{type === "percent" ? "%" : "KES"}</span>
            <input
              autoFocus
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="0"
              min={0}
              max={type === "percent" ? 100 : undefined}
              className="flex-1 bg-transparent text-lg font-semibold text-[var(--color-text)] focus:outline-none"
            />
          </div>

          {totals.lineSubtotal > 0 && value && (
            <p className="mb-4 text-xs text-[var(--color-text-muted)]">
              ≈ KES {(type === "percent"
                ? totals.lineSubtotal * (parseFloat(value) || 0) / 100
                : parseFloat(value) || 0
              ).toLocaleString(undefined, { maximumFractionDigits: 0 })} off
            </p>
          )}

          <div className="flex gap-2">
            {cartDiscount.value > 0 && (
              <button
                onClick={handleRemove}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm text-[var(--color-danger)] hover:bg-red-500/10 transition-colors"
              >
                Remove
              </button>
            )}
            <button
              onClick={handleApply}
              className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Apply
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-2 w-full rounded-lg py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <ManagerPinModal
        isOpen={pinOpen}
        title="Discount Authorization"
        description="Discount exceeds 10% — manager PIN required"
        onSuccess={(_id) => handlePinSuccess(_id)}
        onCancel={() => setPinOpen(false)}
      />
    </>
  )
}
