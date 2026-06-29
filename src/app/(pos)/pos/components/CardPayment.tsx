"use client"

import { useState } from "react"
import { CreditCard, CheckCircle, XCircle } from "lucide-react"

interface CardPaymentProps {
  remaining: number
  customerEmail?: string | null
  onApply: (amount: number, reference: string) => void
}

type Stage = "input" | "processing" | "success" | "failed"

export function CardPayment({ remaining, customerEmail, onApply }: CardPaymentProps) {
  const [amount, setAmount] = useState(String(remaining))
  const [stage, setStage] = useState<Stage>("input")
  const [reference, setReference] = useState("")
  const [error, setError] = useState("")

  async function handlePay() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError("Invalid amount"); return }
    setError("")
    setStage("processing")

    const email = customerEmail ?? "pos@dukapos.co.ke"
    const ref = `DUKA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    try {
      await new Promise<void>((resolve, reject) => {
        const handler = PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
          email,
          amount: Math.round(amt * 100),
          currency: "KES",
          ref,
          metadata: { source: "pos" },
          callback: async (response) => {
            try {
              const res = await fetch(`/api/pos/payments/verify?reference=${response.reference}`)
              const data = await res.json()
              if (data.status === "success") {
                setReference(response.reference)
                setStage("success")
                setTimeout(() => onApply(amt, response.reference), 1000)
                resolve()
              } else {
                reject(new Error("Verification failed"))
              }
            } catch {
              reject(new Error("Verification error"))
            }
          },
          onClose: () => reject(new Error("Closed")),
        })
        handler.openIframe()
      })
    } catch (err: any) {
      if (err?.message === "Closed") {
        setStage("input")
      } else {
        setStage("failed")
        setError(err?.message ?? "Payment failed")
      }
    }
  }

  return (
    <div className="space-y-4">
      {stage === "input" && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Amount (KES)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5">
              <span className="text-sm text-[var(--color-text-muted)]">KES</span>
              <input
                autoFocus
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={String(remaining)}
                min={1}
                className="flex-1 bg-transparent text-lg font-semibold text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

          <button
            onClick={handlePay}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Pay with Card
          </button>
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            Powered by Paystack — Visa, Mastercard accepted
          </p>
        </>
      )}

      {stage === "processing" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-muted)]">Processing payment...</p>
        </div>
      )}

      {stage === "success" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/10">
            <CheckCircle className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <p className="font-semibold text-[var(--color-text)]">Card payment successful!</p>
          <p className="font-mono text-xs text-[var(--color-text-muted)]">{reference}</p>
        </div>
      )}

      {stage === "failed" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
            <XCircle className="h-8 w-8 text-[var(--color-danger)]" />
          </div>
          <p className="font-semibold text-[var(--color-text)]">Payment failed</p>
          <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            onClick={() => { setStage("input"); setError("") }}
            className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
