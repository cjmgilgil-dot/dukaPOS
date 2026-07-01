"use client"

import { useState, useEffect, useRef } from "react"
import { Search, ChevronLeft } from "lucide-react"
import { searchSalesForReturn } from "@/app/(pos)/pos/returns/actions"
import { cn } from "@/lib/utils"

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash", MPESA: "M-Pesa", CARD: "Card", BANK_TRANSFER: "Bank",
}

interface Sale {
  id: string
  saleNumber: string
  createdAt: Date
  status: string
  total: number
  itemCount: number
  customerName: string | null
  paymentMethods: string[]
}

interface SaleLookupProps {
  onSelect(saleId: string): void
  onBack(): void
}

export function SaleLookup({ onSelect, onBack }: SaleLookupProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Load recent sales on mount
    handleSearch("")
  }, [])

  async function handleSearch(q: string) {
    setLoading(true)
    setSearched(true)
    const res = await searchSalesForReturn(q)
    setLoading(false)
    if (res.success) {
      setResults(res.data.map(s => ({ ...s, createdAt: new Date(s.createdAt) })))
    }
  }

  function formatDate(d: Date) {
    return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  function fmtKes(n: number) {
    const [int, dec] = n.toFixed(2).split(".")
    return `KES ${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <h2 className="text-base font-semibold text-[var(--color-text)]">Process Return</h2>
      </div>

      {/* Search bar */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 focus-within:border-[var(--color-primary)]">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch(query)}
            placeholder="Receipt #, customer phone, M-Pesa ref…"
            className="flex-1 bg-transparent py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
          <button
            onClick={() => handleSearch(query)}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Search
          </button>
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          Showing sales from last 90 days · COMPLETED only
        </p>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">No completed sales found</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Try searching by receipt number or customer phone</p>
          </div>
        )}

        {!loading && results.map(sale => (
          <div
            key={sale.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-[var(--color-text)]">{sale.saleNumber}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {formatDate(sale.createdAt)} · {sale.itemCount} item{sale.itemCount !== 1 ? "s" : ""}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {sale.customerName ?? "Walk-in"}
                  {sale.paymentMethods.length > 0 && (
                    <span className="ml-1">
                      · {sale.paymentMethods.map(m => METHOD_LABELS[m] ?? m).join(" + ")}
                    </span>
                  )}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-bold text-[var(--color-text)]">{fmtKes(sale.total)}</p>
                <button
                  onClick={() => onSelect(sale.id)}
                  className="mt-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
