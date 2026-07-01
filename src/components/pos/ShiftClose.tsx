"use client"

import { useEffect, useState, useCallback } from "react"
import { signOut } from "next-auth/react"
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle } from "lucide-react"
import { getShiftSummary, closeShift } from "@/app/(pos)/pos/actions"
import { ManagerPinModal } from "@/components/pos/ManagerPinModal"
import { DenominationCounter } from "./DenominationCounter"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ShiftSummary } from "@/lib/shift/types"
import { shiftDuration } from "@/lib/shift/utils"

const VARIANCE_WARN = 100
const VARIANCE_MANAGER = 1000

function fmtKes(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split(".")
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `KES ${withCommas}.${dec}`
}

interface ShiftCloseProps {
  shiftId: string
  openedAt: Date
  openingFloat: number
  cashierName: string
  onCancel: () => void
  onClosed: () => void
}

export function ShiftClose({
  shiftId,
  openedAt,
  openingFloat,
  cashierName,
  onCancel,
  onClosed,
}: ShiftCloseProps) {
  const [summary, setSummary] = useState<ShiftSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [countedRaw, setCountedRaw] = useState("")
  const [reason, setReason] = useState("")
  const [showDenom, setShowDenom] = useState(false)
  const [denomTotal, setDenomTotal] = useState(0)
  const [showManagerPin, setShowManagerPin] = useState(false)
  const [managerApproval, setManagerApproval] = useState<{ id: string; name: string } | null>(null)
  const [closing, setClosing] = useState(false)

  const counted = parseFloat(countedRaw) || 0
  const variance = summary ? counted - summary.expectedCash : 0
  const absVariance = Math.abs(variance)
  const needsReason = absVariance > VARIANCE_WARN && countedRaw !== ""
  const needsManager = absVariance > VARIANCE_MANAGER && countedRaw !== ""
  const canClose =
    countedRaw !== "" &&
    (!needsReason || reason.trim().length > 0) &&
    (!needsManager || managerApproval !== null)

  useEffect(() => {
    getShiftSummary(shiftId).then(res => {
      if (res.success) setSummary(res.data)
      setLoading(false)
    })
  }, [shiftId])

  const handleDenomChange = useCallback((total: number) => {
    setDenomTotal(total)
    if (total > 0) setCountedRaw(String(total))
  }, [])

  async function handleClose() {
    if (!canClose || closing || !summary) return
    setClosing(true)

    const result = await closeShift({
      shiftId,
      closingCash: counted,
      varianceNote: reason || undefined,
      managerApprovalId: managerApproval?.id,
    })

    setClosing(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Shift closed")
    onClosed()
    // Return to lock screen
    signOut({ callbackUrl: "/pos" })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-danger)]">Failed to load shift summary</p>
      </div>
    )
  }

  const duration = shiftDuration(openedAt)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--color-bg)]">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Close Shift</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {cashierName} · Opened {openedAt.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true })} ({duration} ago)
          </p>
        </div>

        {/* Shift Summary */}
        <section className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Shift Summary</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Total sales</span>
              <span className="font-semibold text-[var(--color-text)]">{summary.completedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Sales total</span>
              <span className="font-mono font-semibold text-[var(--color-text)]">{fmtKes(summary.completedTotal)}</span>
            </div>
            {summary.voidedCount > 0 && (
              <div className="flex justify-between text-[var(--color-danger)]">
                <span>Voids ({summary.voidedCount})</span>
                <span className="font-mono">-{fmtKes(summary.voidedTotal)}</span>
              </div>
            )}
          </div>

          {/* Payment breakdown */}
          <div className="mt-3 space-y-1 border-t border-[var(--color-border)] pt-3 text-sm">
            {summary.cashSales > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Cash</span>
                <span className="font-mono text-[var(--color-text)]">{fmtKes(summary.cashSales)}</span>
              </div>
            )}
            {summary.mpesaTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">M-Pesa</span>
                <span className="font-mono text-[var(--color-text)]">{fmtKes(summary.mpesaTotal)}</span>
              </div>
            )}
            {summary.cardTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Card</span>
                <span className="font-mono text-[var(--color-text)]">{fmtKes(summary.cardTotal)}</span>
              </div>
            )}
            {summary.bankTransferTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Bank Transfer</span>
                <span className="font-mono text-[var(--color-text)]">{fmtKes(summary.bankTransferTotal)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Cash Reconciliation */}
        <section className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Cash Reconciliation</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Opening float</span>
              <span className="font-mono text-[var(--color-text)]">{fmtKes(openingFloat)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">+ Cash sales</span>
              <span className="font-mono text-[var(--color-text)]">{fmtKes(summary.cashSales)}</span>
            </div>
            {summary.cashRefunds > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">- Cash refunds</span>
                <span className="font-mono text-[var(--color-text)]">{fmtKes(summary.cashRefunds)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--color-border)] pt-1.5 font-semibold">
              <span className="text-[var(--color-text)]">Expected in drawer</span>
              <span className="font-mono text-[var(--color-text)]">{fmtKes(summary.expectedCash)}</span>
            </div>
          </div>
        </section>

        {/* Cash count input */}
        <section className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Count Cash in Drawer</h2>
          <div className="flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 focus-within:border-[var(--color-primary)] mb-4">
            <span className="shrink-0 text-sm font-medium text-[var(--color-text-muted)]">KES</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={countedRaw}
              onChange={e => setCountedRaw(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent py-3 pl-2 font-mono text-right text-lg font-semibold text-[var(--color-text)] focus:outline-none"
            />
          </div>

          {/* Denomination counter (collapsible) */}
          <button
            onClick={() => setShowDenom(v => !v)}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            {showDenom ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Count by denomination
          </button>

          {showDenom && (
            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              <DenominationCounter onChange={handleDenomChange} />
            </div>
          )}
        </section>

        {/* Variance */}
        {countedRaw !== "" && (
          <section className={cn(
            "mb-6 rounded-xl border p-4",
            absVariance === 0
              ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/5"
              : absVariance <= VARIANCE_WARN
              ? "border-[var(--color-border)] bg-[var(--color-surface)]"
              : absVariance <= VARIANCE_MANAGER
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-text)]">Variance</span>
              <span className={cn(
                "font-mono text-sm font-bold",
                variance === 0 ? "text-[var(--color-success)]"
                  : variance > 0 ? "text-[var(--color-success)]"
                  : "text-[var(--color-danger)]"
              )}>
                {variance >= 0 ? "+" : "-"}{fmtKes(Math.abs(variance))}
              </span>
            </div>
            {absVariance === 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                <CheckCircle className="h-3.5 w-3.5" />
                Perfect — drawer balanced
              </div>
            )}
            {needsManager && !managerApproval && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-danger)]">
                <AlertTriangle className="h-3.5 w-3.5" />
                Variance exceeds KES 1,000 — manager approval required
              </div>
            )}
            {managerApproval && (
              <p className="mt-1.5 text-xs text-[var(--color-success)]">
                Approved by {managerApproval.name}
              </p>
            )}
          </section>
        )}

        {/* Reason */}
        {needsReason && (
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              Reason for variance <span className="text-[var(--color-danger)]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain the variance…"
              rows={2}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Manager PIN (required for large variance) */}
        {needsManager && !managerApproval && (
          <button
            onClick={() => setShowManagerPin(true)}
            className="mb-4 w-full rounded-xl border border-[var(--color-danger)] py-2.5 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 transition-colors"
          >
            Approve with Manager PIN
          </button>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={closing}
            className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleClose}
            disabled={!canClose || closing}
            className="flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {closing ? "Closing…" : "Close Shift"}
          </button>
        </div>
      </div>

      {showManagerPin && (
        <ManagerPinModal
          isOpen
          title="Manager Approval Required"
          description={`Variance of ${fmtKes(absVariance)} requires manager authorisation`}
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
