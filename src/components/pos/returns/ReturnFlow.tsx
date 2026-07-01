"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { SaleLookup } from "./SaleLookup"
import { ReturnItemSelector, type SelectedReturnItem } from "./ReturnItemSelector"
import { ReturnConfirmation } from "./ReturnConfirmation"
import { ReturnComplete } from "./ReturnComplete"
import { getSaleForReturn, processReturn, type SaleForReturn } from "@/app/(pos)/pos/returns/actions"
import { validateReturn } from "@/lib/returns/policy"
import { toast } from "sonner"
import type { CartCustomer } from "@/contexts/CartContext"

type Step = "lookup" | "items" | "confirm" | "complete"

interface ReturnFlowProps {
  onClose(): void
  onStartExchange(customer: CartCustomer, creditAmount: number, returnNumber: string): void
}

export function ReturnFlow({ onClose, onStartExchange }: ReturnFlowProps) {
  const [step, setStep] = useState<Step>("lookup")
  const [sale, setSale] = useState<SaleForReturn | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedReturnItem[]>([])
  const [isExpiredOverride, setIsExpiredOverride] = useState(false)
  const [result, setResult] = useState<{
    id: string
    returnNumber: string
    total: number
    refundMethod: string
    etimsCreditNoteNo?: string
    customerId: string | null
    customerName: string | null
  } | null>(null)

  async function handleSaleSelect(saleId: string) {
    const res = await getSaleForReturn(saleId)
    if (!res.success) { toast.error(res.error); return }

    const saleData = { ...res.data, createdAt: new Date(res.data.createdAt) }

    // Check return policy
    const policy = validateReturn({ createdAt: saleData.createdAt, status: saleData.status })
    if (!policy.valid) {
      // If only issue is expiry, allow override
      const isExpiryOnly = policy.errors.every(e => e.includes("Return period expired"))
      if (isExpiryOnly) {
        const confirmed = window.confirm(
          `${policy.errors[0]}\n\nProceed with manager override?`
        )
        if (!confirmed) return
        setIsExpiredOverride(true)
      } else {
        toast.error(policy.errors[0])
        return
      }
    }

    setSale(saleData)
    setStep("items")
  }

  function handleItemsContinue(items: SelectedReturnItem[]) {
    setSelectedItems(items)
    setStep("confirm")
  }

  async function handleConfirm(data: {
    reason: any
    reasonNote?: string
    refundMethod: any
    approvedBy: string
    approverName: string
    overrideExpired?: boolean
  }) {
    if (!sale) return

    const res = await processReturn({
      originalSaleId: sale.id,
      items: selectedItems.map(i => ({
        saleItemId: i.saleItemId,
        productVariantId: i.productVariantId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        condition: i.condition,
        serialNumber: i.serialNumber,
      })),
      reason: data.reason,
      reasonNote: data.reasonNote,
      refundMethod: data.refundMethod,
      approvedBy: data.approvedBy,
      overrideExpired: data.overrideExpired ?? isExpiredOverride,
    })

    if (!res.success) {
      toast.error(res.error)
      return
    }

    setResult(res.data)
    setStep("complete")
    toast.success(`Return ${res.data.returnNumber} processed`)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)]">
      {/* Top bar with close */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--color-text)]">Process Return</span>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {step === "lookup" && (
          <SaleLookup onSelect={handleSaleSelect} onBack={onClose} />
        )}
        {step === "items" && sale && (
          <ReturnItemSelector
            sale={sale}
            onContinue={handleItemsContinue}
            onBack={() => setStep("lookup")}
          />
        )}
        {step === "confirm" && sale && (
          <ReturnConfirmation
            sale={sale}
            items={selectedItems}
            isExpiredOverride={isExpiredOverride}
            onConfirm={handleConfirm}
            onBack={() => setStep("items")}
          />
        )}
        {step === "complete" && result && sale && (
          <ReturnComplete
            result={result}
            originalSaleNumber={sale.saleNumber}
            onDone={onClose}
            onStartExchange={(customer, credit, returnNumber) => {
              onStartExchange(customer, credit, returnNumber)
              onClose()
            }}
          />
        )}
      </div>
    </div>
  )
}
