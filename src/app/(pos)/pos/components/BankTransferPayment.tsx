"use client"

import { useState, useEffect, useRef } from "react"
import { Building2, CheckCircle, XCircle, Copy, Check } from "lucide-react"

interface BankTransferPaymentProps {
  remaining: number
  customerEmail?: string | null
  onApply: (amount: number, reference: string) => void
}

type Stage = "input" | "awaiting" | "success" | "failed"

export function BankTransferPayment({ remaining, customerEmail, onApply }: BankTransferPaymentProps) {
  const [amount, setAmount] = useState(String(remaining))
  const [stage, setStage] = useState<Stage>("input")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [account, setAccount] = useState<{
    reference?: string
    bankName: string
    accountNumber: string
    accountName: string
    amount: number
  } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  async function handleInitiate() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError("Invalid amount"); return }
    setError("")
    setStage("awaiting")

    try {
      const res = await fetch("/api/pos/payments/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          email: customerEmail ?? "pos@dukapos.co.ke",
          metadata: { source: "pos" },
        }),
      })
      const data = await res.json()
      setAccount(data)

      if (data.reference) {
        pollRef.current = setInterval(async () => {
          const r = await fetch(`/api/pos/payments/verify?reference=${data.reference}`)
          const v = await r.json()
          if (v.status === "success") {
            clearInterval(pollRef.current!)
            setStage("success")
            setTimeout(() => onApply(amt, data.reference), 1000)
          }
        }, 10_000)
      }
    } catch {
      setStage("failed")
      setError("Failed to generate bank transfer details")
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
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
            onClick={handleInitiate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Generate Bank Account
          </button>
        </>
      )}

      {stage === "awaiting" && account && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] divide-y divide-[var(--color-border)]">
            {[
              { label: "Bank", value: account.bankName, key: "bank" },
              { label: "Account Number", value: account.accountNumber, key: "acc" },
              { label: "Account Name", value: account.accountName, key: "name" },
              { label: "Amount", value: `KES ${account.amount.toLocaleString()}`, key: "amt" },
            ].map(row => (
              <div key={row.key} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">{row.label}</p>
                  <p className="font-medium text-[var(--color-text)]">{row.value}</p>
                </div>
                {row.key !== "amt" && (
                  <button
                    onClick={() => copyToClipboard(row.value, row.key)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {copied === row.key ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
            Waiting for bank confirmation...
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            Account expires in 1 hour. Payment will be confirmed automatically.
          </p>
        </div>
      )}

      {stage === "success" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/10">
            <CheckCircle className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <p className="font-semibold text-[var(--color-text)]">Transfer confirmed!</p>
        </div>
      )}

      {stage === "failed" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
            <XCircle className="h-8 w-8 text-[var(--color-danger)]" />
          </div>
          <p className="font-semibold text-[var(--color-text)]">Failed</p>
          <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            onClick={() => { setStage("input"); setError(""); setAccount(null) }}
            className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
