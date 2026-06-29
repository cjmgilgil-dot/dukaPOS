"use client"

import { useState, useRef, useCallback } from "react"
import { Search, X } from "lucide-react"

interface ProductSearchProps {
  onSearch: (q: string) => void
  placeholder?: string
}

export function ProductSearch({ onSearch, placeholder = "Search by name, SKU, or barcode…" }: ProductSearchProps) {
  const [value, setValue] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((v: string) => {
    setValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSearch(v), 220)
  }, [onSearch])

  function clear() {
    setValue("")
    onSearch("")
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-9 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
