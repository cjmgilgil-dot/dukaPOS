"use client"

import { CheckCircle, Printer } from "lucide-react"
import { printReceipt } from "@/lib/receipt/print-manager"
import type { CartCustomer } from "@/contexts/CartContext"

const REFUND_LABELS: Record<string, string> = {
  CASH: "Cash",
  ORIGINAL_PAYMENT: "Original Payment Method",
  STORE_CREDIT: "Store Credit",
}

function fmtKes(n: number) {
  const [int, dec] = n.toFixed(2).split(".")
  return `KES ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
}

interface ReturnResult {
  id: string
  returnNumber: string
  total: number
  refundMethod: string
  etimsCreditNoteNo?: string
  customerId: string | null
  customerName: string | null
}

interface ReturnCompleteProps {
  result: ReturnResult
  originalSaleNumber: string
  onDone(): void
  onStartExchange(customer: CartCustomer, credit: number, returnNumber: string): void
}

export function ReturnComplete({ result, originalSaleNumber, onDone, onStartExchange }: ReturnCompleteProps) {
  async function handlePrint() {
    const res = await fetch(`/api/returns/${result.id}/receipt`)
    const html = await res.text()
    await printReceipt(html)
  }

  function handleExchange() {
    if (!result.customerId || !result.customerName) return
    onStartExchange(
      { id: result.customerId, name: result.customerName, phone: null, email: null },
      result.total,
      result.returnNumber
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/15">
        <CheckCircle className="h-8 w-8 text-[var(--color-success)]" />
      </div>

      <h2 className="mt-4 text-xl font-bold text-[var(--color-text)]">Return Processed</h2>

      <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 text-left w-full max-w-xs">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Return #</span>
            <span className="font-mono font-semibold text-[var(--color-text)]">{result.returnNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Original Sale</span>
            <span className="font-mono text-[var(--color-text)]">{originalSaleNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Refund</span>
            <span className="font-mono font-bold text-[var(--color-primary)]">{fmtKes(result.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Method</span>
            <span className="text-[var(--color-text)]">{REFUND_LABELS[result.refundMethod] ?? result.refundMethod}</span>
          </div>
          {result.etimsCreditNoteNo && (
            <div className="flex justify-between border-t border-[var(--color-border)] pt-1.5">
              <span className="text-[var(--color-text-muted)]">eTIMS Credit Note</span>
              <span className="font-mono text-xs text-[var(--color-success)]">{result.etimsCreditNoteNo}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Return Receipt
        </button>

        {result.customerId && (
          <button
            onClick={handleExchange}
            className="rounded-xl border border-[var(--color-primary)] py-2.5 text-sm font-medium text-[var(--color-primary)] hover:bg-orange-500/5 transition-colors"
          >
            Start Exchange — Apply {fmtKes(result.total)} Credit
          </button>
        )}

        <button
          onClick={onDone}
          className="rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
