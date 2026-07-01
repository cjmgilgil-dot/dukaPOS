"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import type { SaleForReturn, SaleItemForReturn } from "@/app/(pos)/pos/returns/actions"

const CONDITIONS = ["Resaleable", "Defective", "Damaged"] as const
type Condition = typeof CONDITIONS[number]

export interface SelectedReturnItem {
  saleItemId: string
  productVariantId: string
  productName: string
  variantName: string
  unit: string
  quantity: number
  unitPrice: number
  lineTax: number
  lineTotal: number
  condition: Condition
  serialNumber?: string
}

interface ReturnItemSelectorProps {
  sale: SaleForReturn
  onContinue(items: SelectedReturnItem[]): void
  onBack(): void
}

function fmtKes(n: number) {
  const [int, dec] = n.toFixed(2).split(".")
  return `KES ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
}

const TAX_RATE = 16

export function ReturnItemSelector({ sale, onContinue, onBack }: ReturnItemSelectorProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [conditions, setConditions] = useState<Record<string, Condition>>({})

  function toggle(item: SaleItemForReturn) {
    if (item.availableQty === 0) return
    setSelected(prev => ({ ...prev, [item.id]: !prev[item.id] }))
    if (!quantities[item.id]) {
      setQuantities(prev => ({ ...prev, [item.id]: String(item.availableQty) }))
    }
    if (!conditions[item.id]) {
      setConditions(prev => ({ ...prev, [item.id]: "Resaleable" }))
    }
  }

  function setQty(itemId: string, val: string) {
    setQuantities(prev => ({ ...prev, [itemId]: val }))
  }

  function setCondition(itemId: string, val: Condition) {
    setConditions(prev => ({ ...prev, [itemId]: val }))
  }

  const selectedItems: SelectedReturnItem[] = sale.items
    .filter(si => selected[si.id] && si.availableQty > 0)
    .map(si => {
      const qty = Math.min(parseFloat(quantities[si.id] || "0") || 0, si.availableQty)
      const lineTotal = qty * si.unitPrice
      const lineTax = lineTotal * TAX_RATE / (100 + TAX_RATE)
      return {
        saleItemId: si.id,
        productVariantId: si.productVariantId,
        productName: si.productName,
        variantName: si.variantName,
        unit: si.unit,
        quantity: qty,
        unitPrice: si.unitPrice,
        lineTax,
        lineTotal,
        condition: conditions[si.id] ?? "Resaleable",
        serialNumber: si.serialNumber ?? undefined,
      }
    })
    .filter(i => i.quantity > 0)

  const returnTotal = selectedItems.reduce((s, i) => s + i.lineTotal, 0)
  const vatRefund = selectedItems.reduce((s, i) => s + i.lineTax, 0)

  const canContinue = selectedItems.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Select Items to Return</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {sale.saleNumber} · {sale.customer?.name ?? "Walk-in"}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sale.items.map(si => {
          const isChecked = !!selected[si.id]
          const isUnavailable = si.availableQty === 0

          return (
            <div
              key={si.id}
              className={`rounded-xl border p-4 transition-colors ${
                isUnavailable
                  ? "border-[var(--color-border)] opacity-50"
                  : isChecked
                    ? "border-[var(--color-primary)]/50 bg-orange-500/5"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isUnavailable}
                  onChange={() => toggle(si)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)] cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {si.productName}
                    {si.variantName !== "Default" && (
                      <span className="ml-1 text-xs text-[var(--color-text-muted)]">({si.variantName})</span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Sold: {si.quantity} {si.unit} × {fmtKes(si.unitPrice)} = {fmtKes(si.lineTotal)}
                  </p>
                  {si.previouslyReturned > 0 && (
                    <p className="text-xs text-amber-500">
                      {si.previouslyReturned} {si.unit} previously returned · {si.availableQty} available
                    </p>
                  )}
                  {isUnavailable && (
                    <p className="text-xs text-[var(--color-danger)]">Fully returned</p>
                  )}

                  {isChecked && !isUnavailable && (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-[var(--color-text-muted)]">Qty:</label>
                        <input
                          type="number"
                          min="0.01"
                          max={si.availableQty}
                          step="0.01"
                          value={quantities[si.id] ?? si.availableQty}
                          onChange={e => setQty(si.id, e.target.value)}
                          className="w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-center font-mono text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        />
                        <span className="text-xs text-[var(--color-text-muted)]">of {si.availableQty}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-[var(--color-text-muted)]">Condition:</label>
                        <select
                          value={conditions[si.id] ?? "Resaleable"}
                          onChange={e => setCondition(si.id, e.target.value as Condition)}
                          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs focus:border-[var(--color-primary)] focus:outline-none"
                        >
                          {CONDITIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] p-4 space-y-3">
        {selectedItems.length > 0 && (
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-[var(--color-text-muted)]">{selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected</span>
              <span className="ml-2 text-xs text-[var(--color-text-muted)]">VAT refund: {fmtKes(vatRefund)}</span>
            </div>
            <span className="font-mono font-bold text-[var(--color-text)]">{fmtKes(returnTotal)}</span>
          </div>
        )}
        <button
          disabled={!canContinue}
          onClick={() => onContinue(selectedItems)}
          className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Refund
        </button>
      </div>
    </div>
  )
}
