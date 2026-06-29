"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { bulkDeleteProducts } from "@/app/(dashboard)/dashboard/products/actions"

interface BulkActionsBarProps {
  selectedIds: string[]
  onClear: () => void
}

export function BulkActionsBar({ selectedIds, onClear }: BulkActionsBarProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (selectedIds.length === 0) return null

  function handleDelete() {
    if (!confirm(`Delete ${selectedIds.length} product(s)? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await bulkDeleteProducts(selectedIds)
      if (res.success) {
        toast.success(`${selectedIds.length} product(s) deleted`)
        onClear()
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2.5">
      <span className="text-sm text-[var(--color-text-muted)]">
        {selectedIds.length} selected
      </span>
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        className="h-8 px-3 text-xs min-h-0"
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete
      </Button>
      <button
        onClick={onClear}
        className="ml-auto text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        Cancel
      </button>
    </div>
  )
}
