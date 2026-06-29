"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Badge } from "@/components/ui/Badge"
import { CategoryForm } from "./CategoryForm"
import { deleteCategory, toggleCategoryActive } from "@/app/(dashboard)/dashboard/categories/actions"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import type { Category } from "@/lib/generated/prisma"

interface CategoryWithCount extends Category {
  _count: { products: number }
}

export function CategoryList({ categories }: { categories: CategoryWithCount[] }) {
  const [editing, setEditing] = useState<Category | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleEdit(cat: Category) {
    setEditing(cat)
    setModalOpen(true)
  }

  function handleDelete(cat: CategoryWithCount) {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteCategory(cat.id)
      if (res.success) {
        toast.success("Category deleted")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleToggleActive(cat: Category) {
    startTransition(async () => {
      const res = await toggleCategoryActive(cat.id, !cat.isActive)
      if (res.success) {
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  if (categories.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)]">
        No categories yet. Create your first one.
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">Category</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--color-text-muted)]">Color</th>
              <th className="px-4 py-3 text-center font-medium text-[var(--color-text-muted)]">Products</th>
              <th className="px-4 py-3 text-center font-medium text-[var(--color-text-muted)]">Order</th>
              <th className="px-4 py-3 text-center font-medium text-[var(--color-text-muted)]">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="border-b border-[var(--color-border)] last:border-0 bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5 font-medium text-[var(--color-text)]">
                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                    {cat.name}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {cat.color ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border border-[var(--color-border)]"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">{cat.color}</span>
                    </div>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-[var(--color-text-muted)]">
                  {cat._count.products}
                </td>
                <td className="px-4 py-3 text-center text-[var(--color-text-muted)]">
                  {cat.sortOrder}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    disabled={isPending}
                    className="cursor-pointer disabled:opacity-50"
                  >
                    <Badge variant={cat.isActive ? "success" : "default"}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(cat)}
                      className="h-8 w-8 p-0 min-h-0 min-w-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cat)}
                      disabled={isPending}
                      className="h-8 w-8 p-0 min-h-0 min-w-0 hover:text-[var(--color-danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        title="Edit Category"
      >
        <CategoryForm
          category={editing}
          onSuccess={() => { setModalOpen(false); setEditing(null); router.refresh() }}
          onCancel={() => { setModalOpen(false); setEditing(null) }}
        />
      </Modal>
    </>
  )
}
