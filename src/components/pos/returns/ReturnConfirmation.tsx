"use client"

import { useState } from "react"
import { ChevronLeft, AlertTriangle, CheckCircle, Banknote, RotateCcw, CreditCard } from "lucide-react"
import { ManagerPinModal } from "@/components/pos/ManagerPinModal"
import { cn } from "@/lib/utils"
import type { SaleForReturn } from "@/app/(pos)/pos/returns/actions"
import type { SelectedReturnItem } from "./ReturnItemSelector"

const REASONS = [
  { value: "DEFECTIVE", label: "Defective" },
  { value: "WRONG_ITEM", label: "Wrong Item" },
  { value: "CUSTOMER_CHANGED_MIND", label: "Customer Changed Mind" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "WARRANTY", label: "Warranty" },
  { value: "OTHER", label: "Other (requires note)" },
] as const

type ReasonValue = typeof REASONS[number]["value"]

function fmtKes(n: number) {
  const [int, dec] = n.toFixed(2).split(".")
  return `KES ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
}

interface ConfirmData {
  reason: ReasonValue
  reasonNote?: string
  refundMethod: "CASH" | "ORIGINAL_PAYMENT" | "STORE_CREDIT"
  approvedBy: string
  approverName: string
  overrideExpired?: boolean
}

interface ReturnConfirmationProps {
  sale: SaleForReturn
  items: SelectedReturnItem[]
  isExpiredOverride?: boolean
  onConfirm(data: ConfirmData): void
  onBack(): void
}

export function ReturnConfirmation({ sale, items, isExpiredOverride, onConfirm, onBack }: ReturnConfirmationProps) {
  const [reason, setReason] = useState<ReasonValue>("DEFECTIVE")
  const [reasonNote, setReasonNote] = useState("")
  const [refundMethod, setRefundMethod] = useState<"CASH" | "ORIGINAL_PAYMENT" | "STORE_CREDIT">("CASH")
  const [showManagerPin, setShowManagerPin] = useState(false)
  const [managerApproval, setManagerApproval] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const total = items.reduce((s, i) => s + i.lineTotal, 0)
  const vatRefund = items.reduce((s, i) => s + i.lineTax, 0)

  const needsNote = reason === "OTHER"
  const canSubmit =
    (!needsNote || reasonNote.trim().length > 0) &&
    managerApproval !== null &&
    !submitting

  function handleSubmit() {
    if (!canSubmit || !managerApproval) return
    setSubmitting(true)
    onConfirm({
      reason,
      reasonNote: reasonNote.trim() || undefined,
      refundMethod,
      approvedBy: managerApproval.id,
      approverName: managerApproval.name,
      overrideExpired: isExpiredOverride,
    })
  }

  const refundOptions = [
    {
      value: "CASH" as const,
      label: "Cash Refund",
      icon: Banknote,
      description: "Cash from the drawer",
      available: true,
    },
    {
      value: "ORIGINAL_PAYMENT" as const,
      label: "Original Payment",
      icon: RotateCcw,
      description: "Refund to M-Pesa / card",
      available: sale.hasPaystackPayment,
    },
    {
      value: "STORE_CREDIT" as const,
      label: "Store Credit",
      icon: CreditCard,
      description: "Add to customer balance",
      available: !!sale.customerId,
    },
  ]

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
        <h2 className="text-base font-semibold text-[var(--color-text)]">Confirm Return</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Summary */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Returning {items.length} item{items.length !== 1 ? "s" : ""} from {sale.saleNumber}
          </p>
          <div className="mt-2 space-y-1">
            {items.map(i => (
              <div key={i.saleItemId} className="flex justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">
                  {i.productName}{i.variantName !== "Default" ? ` (${i.variantName})` : ""}
                  {" "}× {i.quantity} [{i.condition}]
                </span>
                <span className="font-mono text-[var(--color-text)]">{fmtKes(i.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-[var(--color-border)] pt-2 text-sm font-bold">
            <span className="text-[var(--color-text)]">Refund Total</span>
            <span className="font-mono text-[var(--color-primary)]">{fmtKes(total)}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">incl. VAT refund {fmtKes(vatRefund)}</p>
        </div>

        {/* Reason */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Reason for Return <span className="text-[var(--color-danger)]">*</span>
          </label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value as ReasonValue)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
          >
            {REASONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {(needsNote || reasonNote) && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              Additional Notes {needsNote && <span className="text-[var(--color-danger)]">*</span>}
            </label>
            <textarea
              value={reasonNote}
              onChange={e => setReasonNote(e.target.value)}
              placeholder="Describe the issue…"
              rows={2}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Refund method */}
        <div>
          <label className="mb-2 block text-xs font-medium text-[var(--color-text-muted)]">Refund Method</label>
          <div className="grid grid-cols-3 gap-2">
            {refundOptions.map(opt => {
              const Icon = opt.icon
              const isSelected = refundMethod === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => opt.available && setRefundMethod(opt.value)}
                  disabled={!opt.available}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                    !opt.available && "opacity-40 cursor-not-allowed",
                    isSelected
                      ? "border-[var(--color-primary)] bg-orange-500/10 text-[var(--color-primary)]"
                      : opt.available
                        ? "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{opt.label}</span>
                  <span className="text-[10px] leading-tight">{opt.description}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Manager approval */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          {managerApproval ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Approved by <strong>{managerApproval.name}</strong></span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Manager approval required for all returns</span>
              </div>
              <button
                onClick={() => setShowManagerPin(true)}
                className="ml-3 shrink-0 rounded-lg border border-amber-500 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/10 transition-colors"
              >
                Approve
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] p-4">
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Processing…" : `Process Return — ${fmtKes(total)}`}
        </button>
      </div>

      {showManagerPin && (
        <ManagerPinModal
          isOpen
          title="Manager Approval Required"
          description="All returns require manager authorisation"
          onSuccess={(id: string, name: string) => {
            setManagerApproval({ id, name })
            setShowManagerPin(false)
          }}
          onCancel={() => setShowManagerPin(false)}
        />
      )}
    </div>
  )
}
