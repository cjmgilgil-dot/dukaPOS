"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ShiftRow } from "../actions"

function fmtKes(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split(".")
  return `KES ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
}

function varianceColor(v: number | null) {
  if (v === null) return "text-[var(--color-text-muted)]"
  const abs = Math.abs(v)
  if (abs <= 100) return "text-[var(--color-success)]"
  if (abs <= 500) return "text-amber-500"
  return "text-[var(--color-danger)]"
}

export function ShiftTable({ shifts }: { shifts: ShiftRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            {["Cashier", "Opened", "Closed", "Duration", "Sales", "Expected", "Counted", "Variance", "Status", ""].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {shifts.map(s => (
            <tr key={s.id} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition-colors">
              <td className="px-4 py-3 font-medium text-[var(--color-text)]">{s.cashierName}</td>
              <td className="px-4 py-3 text-[var(--color-text-muted)]">
                {new Date(s.openedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-muted)]">
                {s.closedAt
                  ? new Date(s.closedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true })
                  : "—"}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-muted)]">{s.duration}</td>
              <td className="px-4 py-3 text-[var(--color-text-muted)]">{s.salesCount}</td>
              <td className="px-4 py-3 font-mono text-[var(--color-text-muted)]">
                {s.expectedCash !== null ? fmtKes(s.expectedCash) : "—"}
              </td>
              <td className="px-4 py-3 font-mono text-[var(--color-text-muted)]">
                {s.closingCash !== null ? fmtKes(s.closingCash) : "—"}
              </td>
              <td className={cn("px-4 py-3 font-mono font-medium", varianceColor(s.variance))}>
                {s.variance !== null
                  ? `${s.variance >= 0 ? "+" : ""}${fmtKes(s.variance)}`
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  s.status === "OPEN"
                    ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                    : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"
                )}>
                  {s.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/shifts/${s.id}`}
                  className="rounded-lg px-2 py-1 text-xs text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {shifts.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[var(--color-text-muted)]">No shifts found</p>
        </div>
      )}
    </div>
  )
}
