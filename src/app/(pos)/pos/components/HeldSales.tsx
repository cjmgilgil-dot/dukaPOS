"use client"

import { useState, useEffect } from "react"
import { Clock, Trash2, RotateCcw, X } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { getHeldSales, resumeHeldSale, discardHeldSale } from "@/app/(pos)/pos/actions"
import { formatCurrency } from "@/lib/utils"

interface HeldSalesProps {
  isOpen: boolean
  onClose: () => void
}

interface HeldSaleSummary {
  id: string
  saleNumber: string
  createdAt: string
  holdNote: string | null
  total: number
  customer: { name: string } | null
  items: { quantity: number; lineTotal: number }[]
}

export function HeldSalesModal({ isOpen, onClose }: HeldSalesProps) {
  const { loadItems, clearCart } = useCart()
  const [sales, setSales] = useState<HeldSaleSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [resuming, setResuming] = useState<string | null>(null)
  const [discarding, setDiscarding] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    getHeldSales().then(res => {
      if (res.success) setSales(res.data as HeldSaleSummary[])
      setLoading(false)
    })
  }, [isOpen])

  async function handleResume(id: string) {
    setResuming(id)
    const res = await resumeHeldSale(id)
    setResuming(null)
    if (res.success) {
      clearCart()
      loadItems(res.data.items, res.data.customer)
      onClose()
    }
  }

  async function handleDiscard(id: string) {
    setDiscarding(id)
    await discardHeldSale(id)
    setDiscarding(null)
    setSales(prev => prev.filter(s => s.id !== id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl animate-in zoom-in-95">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
            <h2 className="font-semibold text-[var(--color-text)]">Held Sales</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : sales.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No held sales</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {sales.map(sale => {
              const itemCount = sale.items.reduce((s, i) => s + Number(i.quantity), 0)
              return (
                <div
                  key={sale.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-[var(--color-text-muted)]">{sale.saleNumber}</p>
                      {sale.customer && (
                        <p className="text-sm font-medium text-[var(--color-text)]">{sale.customer.name}</p>
                      )}
                      {sale.holdNote && (
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)] italic">"{sale.holdNote}"</p>
                      )}
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {itemCount} item{itemCount !== 1 ? "s" : ""} · {formatCurrency(Number(sale.total))}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleResume(sale.id)}
                        disabled={resuming === sale.id}
                        className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
                      >
                        {resuming === sale.id ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        Resume
                      </button>
                      <button
                        onClick={() => handleDiscard(sale.id)}
                        disabled={discarding === sale.id}
                        className="flex items-center justify-center rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-danger)] hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
