"use client"

import { useState } from "react"
import { Trash2, Tag, DollarSign, Edit2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ManagerPinModal } from "@/components/pos/ManagerPinModal"
import { useCart, computeLineDiscountAmount, type CartItem } from "@/contexts/CartContext"

interface CartLineActionsProps {
  item: CartItem
  onQtyEdit: () => void
}

type ActivePanel = "discount" | "override" | null

export function CartLineActions({ item, onQtyEdit }: CartLineActionsProps) {
  const { removeItem, setLineDiscount, overridePrice } = useCart()
  const [panel, setPanel] = useState<ActivePanel>(null)
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(item.lineDiscountType)
  const [discountValue, setDiscountValue] = useState(String(item.lineDiscountValue || ""))
  const [overrideValue, setOverrideValue] = useState(String(item.price))
  const [pinTarget, setPinTarget] = useState<"discount" | "override" | null>(null)
  const [pendingDiscount, setPendingDiscount] = useState<{ type: "percent" | "fixed"; value: number } | null>(null)

  const gross = item.price * item.qty
  const lineDiscountAmt = computeLineDiscountAmount(item)
  const discountPercent = gross > 0 ? (lineDiscountAmt / gross) * 100 : 0
  const DISCOUNT_PIN_THRESHOLD = 10

  function handleDiscountSubmit() {
    const val = parseFloat(discountValue) || 0
    const pct = discountType === "percent" ? val : gross > 0 ? (val / gross) * 100 : 0
    if (pct > DISCOUNT_PIN_THRESHOLD) {
      setPendingDiscount({ type: discountType, value: val })
      setPinTarget("discount")
    } else {
      setLineDiscount(item.variantId, discountType, val)
      setPanel(null)
    }
  }

  function handleOverrideSubmit() {
    setPinTarget("override")
  }

  function handlePinSuccess(managerId: string) {
    if (pinTarget === "discount" && pendingDiscount) {
      setLineDiscount(item.variantId, pendingDiscount.type, pendingDiscount.value, managerId)
      setPendingDiscount(null)
      setPanel(null)
    } else if (pinTarget === "override") {
      const val = parseFloat(overrideValue) || item.originalPrice
      overridePrice(item.variantId, Math.max(0, val), managerId)
      setPanel(null)
    }
    setPinTarget(null)
  }

  return (
    <>
      <div className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        {/* Action row */}
        <div className="flex divide-x divide-[var(--color-border)]">
          <button
            onClick={onQtyEdit}
            className="flex flex-1 items-center justify-center gap-1 py-2 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" /> Qty
          </button>
          <button
            onClick={() => setPanel(panel === "discount" ? null : "discount")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-xs transition-colors",
              panel === "discount"
                ? "bg-orange-500/10 text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            )}
          >
            <Tag className="h-3.5 w-3.5" /> Discount
            {lineDiscountAmt > 0 && (
              <span className="ml-1 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] text-white">
                {discountPercent.toFixed(0)}%
              </span>
            )}
          </button>
          <button
            onClick={() => setPanel(panel === "override" ? null : "override")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-xs transition-colors",
              panel === "override"
                ? "bg-orange-500/10 text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
            )}
          >
            <DollarSign className="h-3.5 w-3.5" /> Price
            {item.priceOverridden && (
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            onClick={() => removeItem(item.variantId)}
            className="flex flex-1 items-center justify-center gap-1 py-2 text-xs text-[var(--color-text-muted)] hover:bg-red-500/10 hover:text-[var(--color-danger)] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Discount panel */}
        {panel === "discount" && (
          <div className="border-t border-[var(--color-border)] p-3 space-y-2">
            <div className="flex gap-1">
              {(["percent", "fixed"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDiscountType(t)}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                    discountType === t
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
                  )}
                >
                  {t === "percent" ? "%" : "KES"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                placeholder="0"
                min={0}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button
                onClick={handleDiscountSubmit}
                className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Apply
              </button>
            </div>
            {lineDiscountAmt > 0 && (
              <button
                onClick={() => { setLineDiscount(item.variantId, "percent", 0); setPanel(null) }}
                className="text-xs text-[var(--color-danger)] hover:underline"
              >
                Remove discount
              </button>
            )}
          </div>
        )}

        {/* Price override panel */}
        {panel === "override" && (
          <div className="border-t border-[var(--color-border)] p-3 space-y-2">
            <p className="text-xs text-[var(--color-text-muted)]">
              Original: KES {item.originalPrice.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={overrideValue}
                onChange={e => setOverrideValue(e.target.value)}
                placeholder={String(item.originalPrice)}
                min={0}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button
                onClick={handleOverrideSubmit}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                Override
              </button>
            </div>
            <p className="text-xs text-amber-500">Requires manager authorization</p>
          </div>
        )}
      </div>

      <ManagerPinModal
        isOpen={pinTarget !== null}
        title={pinTarget === "override" ? "Price Override" : "Discount Authorization"}
        description={pinTarget === "override" ? "Manager PIN required to override price" : "Discount exceeds 10% — manager PIN required"}
        onSuccess={(_id, _name) => handlePinSuccess(_id)}
        onCancel={() => { setPinTarget(null); setPendingDiscount(null) }}
      />
    </>
  )
}
