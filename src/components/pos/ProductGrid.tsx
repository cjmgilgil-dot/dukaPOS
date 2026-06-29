"use client"

import { useState, useEffect, useCallback } from "react"
import { CategoryBar } from "./CategoryBar"
import { ProductSearch } from "./ProductSearch"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import type { Category } from "@/lib/generated/prisma"

interface Variant {
  id: string
  name: string
  unit: string
  price: number
  cost: number
  isDefault: boolean
  stocks: { quantity: number }[]
}

interface Product {
  id: string
  name: string
  sku: string
  category: { id: string; name: string; icon: string | null; color: string | null } | null
  variants: Variant[]
}

interface ProductGridProps {
  categories: Category[]
  branchId: string
  onAddToCart: (product: Product, variant: Variant) => void
}

export function ProductGrid({ categories, branchId, onAddToCart }: ProductGridProps) {
  const [selectedCat, setSelectedCat] = useState("")
  const [query, setQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (q: string, cat: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ branch: branchId, limit: "80" })
      if (q) params.set("q", q)
      if (cat) params.set("cat", cat)
      const res = await fetch(`/api/pos/products/search?${params}`)
      setProducts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => { load(query, selectedCat) }, [query, selectedCat])

  function handleSearch(q: string) {
    setQuery(q)
  }

  function handleCatSelect(cat: string) {
    setSelectedCat(cat)
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <ProductSearch onSearch={handleSearch} />
      <CategoryBar
        categories={categories as any}
        selected={selectedCat}
        onSelect={handleCatSelect}
      />

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-[var(--color-text-muted)] text-sm">
          Loading…
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[var(--color-text-muted)] text-sm">
          No products found.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => {
              const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0]
              if (!defaultVariant) return null
              const stock = Number(defaultVariant.stocks[0]?.quantity ?? 0)
              const outOfStock = stock <= 0

              return (
                <button
                  key={p.id}
                  onClick={() => !outOfStock && onAddToCart(p, defaultVariant)}
                  disabled={outOfStock}
                  className="flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-alt)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CategoryIcon
                    icon={p.category?.icon ?? null}
                    color={p.category?.color ?? null}
                    size="md"
                    className="mb-2"
                  />
                  <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)] leading-tight">
                    {p.name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">{p.sku}</p>
                  <div className="mt-auto pt-2 flex items-end justify-between">
                    <span className="font-semibold text-[var(--color-primary)]">
                      KES {Number(defaultVariant.price).toLocaleString()}
                    </span>
                    <span className={`text-xs ${outOfStock ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`}>
                      {outOfStock ? "Out" : stock}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
