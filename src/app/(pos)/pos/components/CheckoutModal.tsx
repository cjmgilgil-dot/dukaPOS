"use client"

import { useState } from "react"
import { X, Banknote, Smartphone, CreditCard, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart, computeLineDiscountAmount } from "@/contexts/CartContext"
import { completeSale } from "@/app/(pos)/pos/actions"
import { CashPayment } from "./CashPayment"
import { MpesaPayment } from "./MpesaPayment"
import { CardPayment } from "./CardPayment"
import { BankTransferPayment } from "./BankTransferPayment"
import { PaymentSummary, type AppliedPayment } from "./PaymentSummary"
import { SaleComplete } from "./SaleComplete"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  holdId?: string
}

type PayMethod = "CASH" | "MPESA" | "CARD" | "BANK_TRANSFER"

const METHODS: { id: PayMethod; label: string; icon: React.ElementType }[] = [
  { id: "CASH", label: "Cash", icon: Banknote },
  { id: "MPESA", label: "M-Pesa", icon: Smartphone },
  { id: "CARD", label: "Card", icon: CreditCard },
  { id: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2 },
]

interface CompletedSale {
  id: string
  saleNumber: string
  total: number
  changeAmount: number
}

export function CheckoutModal({ isOpen, onClose, holdId }: CheckoutModalProps) {
  const { items, cartDiscount, customer, totals, clearCart } = useCart()
  const [activeMethod, setActiveMethod] = useState<PayMethod>("CASH")
  const [payments, setPayments] = useState<AppliedPayment[]>([])
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState("")
  const [completed, setCompleted] = useState<CompletedSale | null>(null)

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, totals.total - totalPaid)
  const canComplete = totalPaid >= totals.total && items.length > 0

  function addPayment(method: PayMethod, amount: number, extras: Partial<AppliedPayment> = {}) {
    setPayments(prev => [...prev, { method, amount, ...extras }])
  }

  function removePayment(index: number) {
    setPayments(prev => prev.filter((_, i) => i !== index))
  }

  async function handleComplete() {
    if (!canComplete || completing) return
    setCompleting(true)
    setError("")

    const saleItems = items.map(item => ({
      productVariantId: item.variantId,
      qty: item.qty,
      unitPrice: item.price,
      lineDiscountAmount: computeLineDiscountAmount(item),
      taxRate: item.taxRate,
    }))

    const priceOverrides = items
      .filter(i => i.priceOverridden && i.priceOverrideApprovedBy)
      .map(i => ({
        variantId: i.variantId,
        originalPrice: i.originalPrice,
        newPrice: i.price,
        approvedBy: i.priceOverrideApprovedBy!,
      }))

    const salePayments = payments.map(p => ({
      method: p.method,
      amount: p.amount,
      reference: p.reference ?? undefined,
      paystackReference: p.paystackReference ?? undefined,
      paystackChannel: p.paystackChannel ?? undefined,
      mpesaPhoneNumber: p.mpesaPhoneNumber ?? undefined,
    }))

    const result = await completeSale({
      items: saleItems,
      payments: salePayments,
      customerId: customer?.id,
      cartDiscountAmount: totals.cartDiscountAmount,
      holdId,
      priceOverrides,
    })

    setCompleting(false)
    if (result.success) {
      setCompleted(result.data)
    } else {
      setError(result.error)
    }
  }

  function handleReset() {
    clearCart()
    setPayments([])
    setCompleted(null)
    setError("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={completed ? undefined : onClose} />
      <div className="relative ml-auto flex h-full w-full max-w-lg flex-col bg-[var(--color-surface)] shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {completed ? "Sale Complete" : "Checkout"}
          </h2>
          {!completed && (
            <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {completed ? (
          <SaleComplete
            saleNumber={completed.saleNumber}
            total={completed.total}
            changeAmount={completed.changeAmount}
            onReset={handleReset}
          />
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Order summary */}
            <div className="border-b border-[var(--color-border)] px-5 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                  {customer && <span className="ml-2">· {customer.name}</span>}
                </span>
                <span className="font-mono font-bold text-[var(--color-primary)]">
                  KES {totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              {totals.cartDiscountAmount > 0 && (
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  Includes KES {totals.cartDiscountAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} discount
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Payment summary */}
              <PaymentSummary
                total={totals.total}
                payments={payments}
                onRemove={removePayment}
              />

              {/* Method tabs */}
              {remaining > 0 && (
                <div>
                  <div className="mb-3 flex gap-1 rounded-xl bg-[var(--color-surface-alt)] p-1">
                    {METHODS.map(m => {
                      const Icon = m.icon
                      return (
                        <button
                          key={m.id}
                          onClick={() => setActiveMethod(m.id)}
                          className={cn(
                            "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium transition-colors",
                            activeMethod === m.id
                              ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm"
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {m.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                    {activeMethod === "CASH" && (
                      <CashPayment
                        remaining={remaining}
                        onApply={amt => addPayment("CASH", amt)}
                      />
                    )}
                    {activeMethod === "MPESA" && (
                      <MpesaPayment
                        remaining={remaining}
                        customerPhone={customer?.phone}
                        customerEmail={customer?.email}
                        onApply={(amt, ref) => addPayment("MPESA", amt, { reference: ref, mpesaPhoneNumber: customer?.phone ?? undefined })}
                      />
                    )}
                    {activeMethod === "CARD" && (
                      <CardPayment
                        remaining={remaining}
                        customerEmail={customer?.email}
                        onApply={(amt, ref) => addPayment("CARD", amt, { paystackReference: ref, paystackChannel: "card" })}
                      />
                    )}
                    {activeMethod === "BANK_TRANSFER" && (
                      <BankTransferPayment
                        remaining={remaining}
                        customerEmail={customer?.email}
                        onApply={(amt, ref) => addPayment("BANK_TRANSFER", amt, { reference: ref })}
                      />
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-xl bg-[var(--color-danger)]/10 px-4 py-3 text-sm text-[var(--color-danger)]">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--color-border)] p-4">
              <button
                onClick={handleComplete}
                disabled={!canComplete || completing}
                className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {completing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </span>
                ) : remaining > 0 ? (
                  `Remaining KES ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                ) : (
                  `Complete Sale — KES ${totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
