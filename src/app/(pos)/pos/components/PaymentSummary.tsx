"use client"

import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AppliedPayment {
  method: "CASH" | "MPESA" | "CARD" | "BANK_TRANSFER"
  amount: number
  reference?: string
  mpesaPhoneNumber?: string
  paystackReference?: string
  paystackChannel?: string
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MPESA: "M-Pesa",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
}

interface PaymentSummaryProps {
  total: number
  payments: AppliedPayment[]
  onRemove: (index: number) => void
}

export function PaymentSummary({ total, payments, onRemove }: PaymentSummaryProps) {
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, total - totalPaid)
  const change = Math.max(0, totalPaid - total)

  return (
    <div className="space-y-1">
      {payments.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {payments.map((pmt, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-[var(--color-surface-alt)] px-3 py-2"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {METHOD_LABELS[pmt.method]}
                </span>
                {pmt.reference && (
                  <p className="truncate font-mono text-xs text-[var(--color-text-muted)]">{pmt.reference}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-sm font-semibold text-[var(--color-text)]">
                  KES {pmt.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                {pmt.method === "CASH" && (
                  <button
                    onClick={() => onRemove(i)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5 rounded-xl border border-[var(--color-border)] p-3">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Sale Total</span>
          <span className="font-mono font-semibold text-[var(--color-text)]">
            KES {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Paid</span>
          <span className="font-mono font-semibold text-[var(--color-success)]">
            KES {totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className={cn("flex justify-between border-t border-[var(--color-border)] pt-1.5 text-sm font-bold")}>
          {remaining > 0 ? (
            <>
              <span className="text-[var(--color-danger)]">Remaining</span>
              <span className="font-mono text-[var(--color-danger)]">
                KES {remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </>
          ) : (
            <>
              <span className="text-[var(--color-success)]">Change</span>
              <span className="font-mono text-[var(--color-success)]">
                KES {change.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
