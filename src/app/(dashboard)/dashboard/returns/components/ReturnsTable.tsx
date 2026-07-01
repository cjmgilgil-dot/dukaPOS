"use client"

import Link from "next/link"
import type { ReturnRow } from "../actions"

const REASON_LABELS: Record<string, string> = {
  DEFECTIVE: "Defective",
  WRONG_ITEM: "Wrong Item",
  CUSTOMER_CHANGED_MIND: "Changed Mind",
  DAMAGED: "Damaged",
  WARRANTY: "Warranty",
  OTHER: "Other",
}

const REFUND_LABELS: Record<string, string> = {
  CASH: "Cash",
  ORIGINAL_PAYMENT: "Original Payment",
  STORE_CREDIT: "Store Credit",
}

function fmtKes(n: number) {
  const [int, dec] = n.toFixed(2).split(".")
  return `KES ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
}

export function ReturnsTable({ returns }: { returns: ReturnRow[] }) {
  if (returns.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-16">
        <p className="text-sm text-[var(--color-text-muted)]">No returns found</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            {["Return #", "Original Sale", "Date", "Customer", "Items", "Total", "Refund", "Reason"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {returns.map(r => (
            <tr key={r.id} className="hover:bg-[var(--color-surface-alt)] transition-colors">
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/returns/${r.id}`}
                  className="font-mono text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                  {r.returnNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/sales`}
                  className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  {r.originalSaleNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                {new Date(r.createdAt).toLocaleDateString("en-KE", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </td>
              <td className="px-4 py-3 text-xs text-[var(--color-text)]">
                {r.customerName ?? <span className="text-[var(--color-text-muted)]">Walk-in</span>}
              </td>
              <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">{r.itemCount}</td>
              <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--color-text)]">
                {fmtKes(r.total)}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                  {REFUND_LABELS[r.refundMethod] ?? r.refundMethod}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                {REASON_LABELS[r.reason] ?? r.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
