"use client"

import { cn } from "@/lib/utils"

interface Variant {
  id: string
  name: string
  unit: string
  price: number
  cost: number
  taxRate?: number
  stock?: number
}

interface VariantPickerModalProps {
  isOpen: boolean
  productName: string
  variants: Variant[]
  onSelect: (variant: Variant) => void
  onClose: () => void
}

export function VariantPickerModal({
  isOpen,
  productName,
  variants,
  onSelect,
  onClose,
}: VariantPickerModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl animate-in zoom-in-95">
        <div className="mb-4">
          <h2 className="font-semibold text-[var(--color-text)]">Select Variant</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{productName}</p>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {variants.map((v) => {
            const outOfStock = typeof v.stock === "number" && v.stock <= 0
            return (
              <button
                key={v.id}
                onClick={() => !outOfStock && onSelect(v)}
                disabled={outOfStock}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                  outOfStock
                    ? "border-[var(--color-border)] opacity-40 cursor-not-allowed"
                    : "border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:border-[var(--color-primary)] hover:bg-orange-500/5 active:scale-[0.98]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--color-text)]">{v.name}</span>
                  <span className="font-mono text-sm font-semibold text-[var(--color-primary)]">
                    KES {v.price.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <span>Unit: {v.unit}</span>
                  {typeof v.stock === "number" && (
                    <span className={outOfStock ? "text-[var(--color-danger)]" : ""}>
                      {outOfStock ? "Out of stock" : `${v.stock} in stock`}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
