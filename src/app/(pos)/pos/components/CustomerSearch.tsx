"use client"

import { useState, useEffect, useRef } from "react"
import { Search, UserPlus, X, Check } from "lucide-react"
import { useCart, type CartCustomer } from "@/contexts/CartContext"
import { searchCustomers, createCustomer } from "@/app/(pos)/pos/actions"
import { cn } from "@/lib/utils"

interface CustomerSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function CustomerSearchModal({ isOpen, onClose }: CustomerSearchProps) {
  const { customer, setCustomer } = useCart()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CartCustomer[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [createError, setCreateError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setResults([])
      setCreating(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchCustomers(query)
      setLoading(false)
      if (res.success) setResults(res.data)
    }, 220)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, isOpen])

  function selectCustomer(c: CartCustomer) {
    setCustomer(c)
    onClose()
  }

  function removeCustomer() {
    setCustomer(null)
    onClose()
  }

  async function handleCreate() {
    if (!newName.trim()) { setCreateError("Name is required"); return }
    setCreateError("")
    setLoading(true)
    const res = await createCustomer(newName.trim(), newPhone.trim())
    setLoading(false)
    if (res.success) {
      selectCustomer(res.data)
    } else {
      setCreateError(res.error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl animate-in zoom-in-95">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">
            {creating ? "New Customer" : "Assign Customer"}
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current customer */}
        {customer && !creating && (
          <div className="mb-3 flex items-center justify-between rounded-xl bg-orange-500/10 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">{customer.name}</p>
              {customer.phone && <p className="text-xs text-[var(--color-text-muted)]">{customer.phone}</p>}
            </div>
            <button onClick={removeCustomer} className="text-[var(--color-danger)] hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!creating ? (
          <>
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] py-2.5 pl-9 pr-4 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              {loading && (
                <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              )}
            </div>

            {/* Results */}
            <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
              {results.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectCustomer(c)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{c.name}</p>
                    {c.phone && <p className="text-xs text-[var(--color-text-muted)]">{c.phone}</p>}
                  </div>
                  {customer?.id === c.id && <Check className="h-4 w-4 text-[var(--color-primary)]" />}
                </button>
              ))}
              {query.trim() && !loading && results.length === 0 && (
                <p className="py-3 text-center text-sm text-[var(--color-text-muted)]">No customers found</p>
              )}
            </div>

            <button
              onClick={() => { setCreating(true); setNewName(""); setNewPhone(""); setCreateError("") }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-2.5 text-sm text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Quick Add Customer
            </button>
          </>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-muted)]">Name *</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-muted)]">Phone</label>
                <input
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+254..."
                  type="tel"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              {createError && <p className="text-xs text-[var(--color-danger)]">{createError}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCreating(false)}
                className={cn(
                  "flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
                )}
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving..." : "Save & Select"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
