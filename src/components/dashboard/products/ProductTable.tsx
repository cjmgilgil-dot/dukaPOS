"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { BulkActionsBar } from "./BulkActionsBar"
import { toggleProductActive, softDeleteProduct } from "@/app/(dashboard)/dashboard/products/actions"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import type { Category, Product, ProductVariant, ProductStock } from "@/lib/generated/prisma"

interface ProductRow extends Product {
  category: Category | null
  variants: (ProductVariant & { stocks: ProductStock[] })[]
}

interface ProductTableProps {
  products: ProductRow[]
  branchId: string
}

export function ProductTable({ products, branchId }: ProductTableProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const allIds = products.map((p) => p.id)
  const allChecked = selected.length === allIds.length && allIds.length > 0
  const someChecked = selected.length > 0 && !allChecked

  function toggleAll() {
    setSelected(allChecked ? [] : allIds)
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return
    startTransition(async () => {
      const res = await softDeleteProduct(p.id)
      if (res.success) {
        toast.success("Product deleted")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleToggle(p: Product) {
    startTransition(async () => {
      const res = await toggleProductActive(p.id, !p.isActive)
      if (!res.success) toast.error(res.error)
      else router.refresh()
    })
  }

  if (products.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)]">
        No products found.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <BulkActionsBar selectedIds={selected} onClear={() => setSelected([])} />

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked }}
                  onChange={toggleAll}
                  className="accent-[var(--color-primary)]"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">Product</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">Category</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">Price</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--color-text-muted)]">Stock</th>
              <th className="px-4 py-3 text-center font-medium text-[var(--color-text-muted)]">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0]
              const totalStock = p.variants.reduce((sum, v) => {
                const s = v.stocks.find((s) => s.branchId === branchId)
                return sum + Number(s?.quantity ?? 0)
              }, 0)
              const lowStock = p.variants.some((v) => {
                const s = v.stocks.find((s) => s.branchId === branchId)
                return s && Number(s.quantity) <= Number(s.reorderLevel)
              })

              return (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-border)] last:border-0 bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggle(p.id)}
                      className="accent-[var(--color-primary)]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-text)]">{p.name}</p>
                    {p.variants.length > 1 && (
                      <p className="text-xs text-[var(--color-text-muted)]">{p.variants.length} variants</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{p.sku}</td>
                  <td className="px-4 py-3">
                    {p.category ? (
                      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                        <CategoryIcon icon={p.category.icon} color={p.category.color} size="sm" />
                        {p.category.name}
                      </div>
                    ) : <span className="text-[var(--color-text-muted)]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--color-text)]">
                    {defaultVariant
                      ? `KES ${Number(defaultVariant.price).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={lowStock ? "text-[var(--color-warning)] font-medium" : "text-[var(--color-text-muted)]"}>
                      {totalStock.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(p)} disabled={isPending} className="cursor-pointer disabled:opacity-50">
                      <Badge variant={p.isActive ? "success" : "default"}>
                        {p.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/products/${p.id}/edit`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(p)}
                        disabled={isPending}
                        className="h-8 w-8 p-0 min-h-0 min-w-0 hover:text-[var(--color-danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
