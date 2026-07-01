"use client"

import { useState } from "react"
import { Printer, AlertTriangle } from "lucide-react"
import { SalesTable } from "../../sales/components/SalesTable"
import { ForceCloseModal } from "./ForceCloseModal"
import { cn } from "@/lib/utils"
import type { ZReport } from "@/lib/shift/types"

function fmtKes(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split(".")
  return `KES ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
}

function varianceColor(v: number) {
  const abs = Math.abs(v)
  if (abs <= 100) return "text-[var(--color-success)]"
  if (abs <= 500) return "text-amber-500"
  return "text-[var(--color-danger)]"
}

interface ShiftDetailProps {
  report: ZReport
  sales: {
    id: string
    saleNumber: string
    status: string
    total: number
    createdAt: string
    customer: { name: string } | null
    user: { name: string }
    payments: { method: string; amount: number }[]
    items: { quantity: number }[]
  }[]
  shiftId: string
  cashierName: string
  isOpen: boolean
}

export function ShiftDetail({ report, sales, shiftId, cashierName, isOpen }: ShiftDetailProps) {
  const [showForceClose, setShowForceClose] = useState(false)
  const s = report.summary

  async function printZReport() {
    const res = await fetch(`/api/shifts/${shiftId}/x-report`)
    const html = await res.text()
    const { printReceipt } = await import("@/lib/receipt/print-manager")
    await printReceipt(html)
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {isOpen ? "X-Report (Shift in Progress)" : "Z-Report"}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {report.cashierName} · {report.branchName} · {report.duration}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={printZReport}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print {isOpen ? "X" : "Z"}-Report
          </button>
          {isOpen && (
            <button
              onClick={() => setShowForceClose(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 px-3 py-1.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              Force Close
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Completed Sales", value: String(s.completedCount) },
          { label: "Net Sales", value: fmtKes(s.completedTotal) },
          { label: "VAT Collected", value: fmtKes(s.totalVAT) },
          { label: "Total Discounts", value: s.totalDiscounts > 0 ? `-${fmtKes(s.totalDiscounts)}` : "None" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
            <p className="mt-1 font-mono text-lg font-bold text-[var(--color-text)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Payment breakdown */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Payment Breakdown</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Cash", value: s.cashSales },
              { label: "M-Pesa", value: s.mpesaTotal },
              { label: "Card", value: s.cardTotal },
              { label: "Bank Transfer", value: s.bankTransferTotal },
              { label: "Credit", value: s.creditTotal },
            ].filter(r => r.value > 0).map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">{r.label}</span>
                <span className="font-mono text-[var(--color-text)]">{fmtKes(r.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cash reconciliation */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Cash Reconciliation</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Opening float</span>
              <span className="font-mono text-[var(--color-text)]">{fmtKes(report.openingFloat)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">+ Cash sales</span>
              <span className="font-mono text-[var(--color-text)]">{fmtKes(s.cashSales)}</span>
            </div>
            {s.cashRefunds > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">- Cash refunds</span>
                <span className="font-mono text-[var(--color-text)]">{fmtKes(s.cashRefunds)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--color-border)] pt-2 font-semibold">
              <span className="text-[var(--color-text)]">Expected</span>
              <span className="font-mono text-[var(--color-text)]">{fmtKes(s.expectedCash)}</span>
            </div>
            {report.countedCash !== undefined && (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Counted</span>
                  <span className="font-mono text-[var(--color-text)]">{fmtKes(report.countedCash)}</span>
                </div>
                <div className={cn("flex justify-between font-semibold", varianceColor(report.variance ?? 0))}>
                  <span>Variance</span>
                  <span className="font-mono">
                    {(report.variance ?? 0) >= 0 ? "+" : ""}{fmtKes(report.variance ?? 0)}
                  </span>
                </div>
                {report.varianceNote && (
                  <p className="text-xs text-[var(--color-text-muted)]">Note: {report.varianceNote}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top items */}
      {report.topItems.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Top Items by Revenue</h3>
          <div className="space-y-1.5">
            {report.topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">
                  {i + 1}. {item.productName}
                  {item.variantName !== "Default" && (
                    <span className="text-xs"> ({item.variantName})</span>
                  )}
                </span>
                <span className="font-mono text-[var(--color-text)]">{fmtKes(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales list */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Sales in this Shift</h3>
        <SalesTable sales={sales} />
      </div>

      {showForceClose && (
        <ForceCloseModal
          shiftId={shiftId}
          cashierName={cashierName}
          onClose={() => setShowForceClose(false)}
        />
      )}
    </div>
  )
}
