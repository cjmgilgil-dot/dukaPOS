"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/generated/prisma"

interface ProductFiltersProps {
  categories: Category[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const q = searchParams.get("q") ?? ""
  const catId = searchParams.get("cat") ?? ""
  const status = searchParams.get("status") ?? ""

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page")
    startTransition(() => router.push(`${pathname}?${params}`))
  }

  function clearAll() {
    startTransition(() => router.push(pathname))
  }

  const hasFilters = q || catId || status

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Search products…"
          defaultValue={q}
          onChange={(e) => updateParam("q", e.target.value)}
          className={cn(
            "h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]",
            "pl-9 pr-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]",
            isPending && "opacity-70"
          )}
        />
      </div>

      {/* Category filter */}
      <select
        value={catId}
        onChange={(e) => updateParam("cat", e.target.value)}
        className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon ? `${c.icon} ` : ""}{c.name}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => updateParam("status", e.target.value)}
        className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  )
}
