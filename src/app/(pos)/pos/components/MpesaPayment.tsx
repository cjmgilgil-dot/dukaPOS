"use client"

import { useState, useEffect, useRef } from "react"
import { Smartphone, CheckCircle, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface MpesaPaymentProps {
  remaining: number
  customerPhone?: string | null
  customerEmail?: string | null
  onApply: (amount: number, reference: string) => void
}

type Stage = "input" | "pending" | "success" | "failed"
const POLL_INTERVAL = 5000
const TIMEOUT_MS = 120_000

export function MpesaPayment({ remaining, customerPhone, customerEmail, onApply }: MpesaPaymentProps) {
  const [phone, setPhone] = useState(customerPhone ?? "")
  const [amount, setAmount] = useState(String(remaining))
  const [stage, setStage] = useState<Stage>("input")
  const [reference, setReference] = useState("")
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cleanup() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  useEffect(() => () => cleanup(), [])

  async function handleSendStk() {
    const amt = parseFloat(amount)
    if (!phone.trim()) { setError("Phone number required"); return }
    if (!amt || amt <= 0) { setError("Invalid amount"); return }

    setError("")
    setStage("pending")
    setTimeLeft(TIMEOUT_MS / 1000)

    try {
      const res = await fetch("/api/pos/payments/mpesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          amount: amt,
          email: customerEmail ?? "pos@dukapos.co.ke",
          metadata: { source: "pos" },
        }),
      })
      const data = await res.json()
      if (!data.reference) throw new Error("No reference returned")
      setReference(data.reference)

      // Countdown
      const startTime = Date.now()
      const ticker = setInterval(() => {
        const elapsed = Date.now() - startTime
        setTimeLeft(Math.max(0, Math.ceil((TIMEOUT_MS - elapsed) / 1000)))
      }, 1000)

      // Poll
      pollRef.current = setInterval(async () => {
        const r = await fetch(`/api/pos/payments/verify?reference=${data.reference}`)
        const v = await r.json()
        if (v.status === "success") {
          cleanup()
          clearInterval(ticker)
          setStage("success")
          setTimeout(() => onApply(amt, data.reference), 1000)
        } else if (v.status === "failed") {
          cleanup()
          clearInterval(ticker)
          setStage("failed")
          setError("Payment declined or cancelled")
        }
      }, POLL_INTERVAL)

      // Timeout
      timeoutRef.current = setTimeout(() => {
        cleanup()
        clearInterval(ticker)
        setStage("failed")
        setError("Payment timed out. Please try again.")
      }, TIMEOUT_MS)
    } catch {
      setStage("failed")
      setError("Failed to initiate payment")
    }
  }

  function handleRetry() {
    cleanup()
    setStage("input")
    setError("")
    setReference("")
  }

  return (
    <div className="space-y-4">
      {stage === "input" && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              M-Pesa Phone Number
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5">
              <Smartphone className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
              <input
                autoFocus
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0712345678 or +254..."
                className="flex-1 bg-transparent text-sm text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
              Amount (KES)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5">
              <span className="text-sm text-[var(--color-text-muted)]">KES</span>
              <input
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
            onClick={handleSendStk}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 transition-colors"
          >
            Send STK Push
          </button>
        </>
      )}

      {stage === "pending" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Clock className="h-8 w-8 text-green-500 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--color-text)]">Waiting for payment</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Check your phone ({phone}) and enter M-Pesa PIN
            </p>
          </div>
          <div className="w-full rounded-xl bg-[var(--color-surface-alt)] px-4 py-2 text-center">
            <p className="font-mono text-xs text-[var(--color-text-muted)]">{reference}</p>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Time remaining: <span className="font-mono font-semibold">{timeLeft}s</span>
          </p>
          <button
            onClick={handleRetry}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {stage === "success" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/10">
            <CheckCircle className="h-8 w-8 text-[var(--color-success)]" />
          </div>
          <p className="font-semibold text-[var(--color-text)]">Payment received!</p>
          <p className="font-mono text-xs text-[var(--color-text-muted)]">{reference}</p>
        </div>
      )}

      {stage === "failed" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
            <XCircle className="h-8 w-8 text-[var(--color-danger)]" />
          </div>
          <p className="font-semibold text-[var(--color-text)]">Payment failed</p>
          <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            onClick={handleRetry}
            className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
