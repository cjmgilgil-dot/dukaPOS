"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { VoidSaleModal } from "./VoidSaleModal"

interface SaleRow {
  id: string
  saleNumber: string
  status: string
  total: number
  createdAt: string
  customer: { name: string } | null
  user: { name: string }
  payments: { method: string; amount: number }[]
  items: { quantity: number }[]
}

interface SalesTableProps {
  sales: SaleRow[]
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  VOIDED: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  HELD: "bg-amber-500/10 text-amber-500",
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MPESA: "M-Pesa",
  CARD: "Card",
  BANK_TRANSFER: "Bank",
}

export function SalesTable({ sales }: SalesTableProps) {
  const router = useRouter()
  const [voidTarget, setVoidTarget] = useState<SaleRow | null>(null)

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
              {["Sale #", "Customer", "Cashier", "Items", "Payment", "Total", "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {sales.map(sale => {
              const itemCount = sale.items.reduce((s, i) => s + Number(i.quantity), 0)
              const methods = [...new Set(sale.payments.map(p => p.method))]
                .map(m => METHOD_LABELS[m] ?? m)
                .join(" + ")

              return (
                <tr key={sale.id} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">{sale.saleNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[var(--color-text)]">
                      {sale.customer?.name ?? <span className="text-[var(--color-text-muted)]">Walk-in</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{sale.user.name}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{itemCount}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{methods || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-[var(--color-text)]">
                      {formatCurrency(Number(sale.total))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_COLORS[sale.status] ?? "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"
                    )}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {sale.status === "COMPLETED" && (
                      <button
                        onClick={() => setVoidTarget(sale)}
                        className="rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] transition-colors"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {sales.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-[var(--color-text-muted)]">No sales found</p>
          </div>
        )}
      </div>

      {voidTarget && (
        <VoidSaleModal
          isOpen
          saleId={voidTarget.id}
          saleNumber={voidTarget.saleNumber}
          onClose={() => setVoidTarget(null)}
          onVoided={() => { setVoidTarget(null); router.refresh() }}
        />
      )}
    </>
  )
}
