"use client"

import { Printer } from "lucide-react"
import Link from "next/link"
import { printReceipt } from "@/lib/receipt/print-manager"
import type { ReturnDetailData } from "../actions"

const REASON_LABELS: Record<string, string> = {
  DEFECTIVE: "Defective",
  WRONG_ITEM: "Wrong Item",
  CUSTOMER_CHANGED_MIND: "Customer Changed Mind",
  DAMAGED: "Damaged",
  WARRANTY: "Warranty",
  OTHER: "Other",
}

const REFUND_LABELS: Record<string, string> = {
  CASH: "Cash",
  ORIGINAL_PAYMENT: "Original Payment Method",
  STORE_CREDIT: "Store Credit",
}

function fmtKes(n: number) {
  const [int, dec] = n.toFixed(2).split(".")
  return `KES ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
}

export function ReturnDetail({ ret }: { ret: ReturnDetailData }) {
  async function handlePrint() {
    const res = await fetch(`/api/returns/${ret.id}/receipt`)
    const html = await res.text()
    await printReceipt(html)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">Return Detail</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {ret.cashierName} · {new Date(ret.createdAt).toLocaleString("en-KE", {
              day: "2-digit", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit", hour12: true,
            })}
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Return Receipt
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Refund Total", value: fmtKes(ret.total) },
          { label: "VAT Refund", value: fmtKes(ret.taxTotal) },
          { label: "Refund Method", value: REFUND_LABELS[ret.refundMethod] ?? ret.refundMethod },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
            <p className="mt-1 font-mono text-lg font-bold text-[var(--color-text)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Details */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Return Details</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Return #", value: ret.returnNumber },
              { label: "Original Sale", value: ret.originalSaleNumber, href: `/dashboard/sales` },
              { label: "Customer", value: ret.customerName ?? "Walk-in" },
              { label: "Reason", value: REASON_LABELS[ret.reason] ?? ret.reason },
              ...(ret.reasonNote ? [{ label: "Note", value: ret.reasonNote }] : []),
              ...(ret.refundReference ? [{ label: "Refund Ref", value: ret.refundReference }] : []),
              ...(ret.etimsCreditNoteNo ? [{ label: "eTIMS Credit Note", value: ret.etimsCreditNoteNo }] : []),
            ].map(row => (
              <div key={row.label} className="flex justify-between gap-4">
                <span className="shrink-0 text-[var(--color-text-muted)]">{row.label}</span>
                <span className="font-mono text-right text-[var(--color-text)] truncate">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Audit Trail</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Processed by", value: ret.cashierName },
              { label: "Approved by", value: ret.approverName ?? "—" },
              { label: "Date & time", value: new Date(ret.createdAt).toLocaleString("en-KE", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit", hour12: true,
                }) },
              { label: "Status", value: ret.status },
            ].map(row => (
              <div key={row.label} className="flex justify-between gap-4">
                <span className="shrink-0 text-[var(--color-text-muted)]">{row.label}</span>
                <span className="text-right text-[var(--color-text)]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Returned items */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Returned Items</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
              {["Item", "Qty", "Unit Price", "Line Total", "Condition"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {ret.items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-[var(--color-text)]">
                  {item.productName}
                  {item.variantName !== "Default" && (
                    <span className="ml-1 text-xs text-[var(--color-text-muted)]">({item.variantName})</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-text)]">{item.quantity} {item.unit}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-text)]">{fmtKes(item.unitPrice)}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--color-text)]">{fmtKes(item.lineTotal)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    item.condition === "Resaleable"
                      ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : item.condition === "Defective"
                        ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                        : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {item.condition ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
