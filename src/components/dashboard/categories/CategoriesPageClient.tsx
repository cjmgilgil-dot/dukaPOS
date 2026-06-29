"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { CategoryForm } from "./CategoryForm"
import { CategoryList } from "./CategoryList"
import type { Category } from "@/lib/generated/prisma"
import { useRouter } from "next/navigation"

interface CategoryWithCount extends Category {
  _count: { products: number }
}

export function CategoriesPageClient({ categories }: { categories: CategoryWithCount[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  function handleSuccess() {
    setModalOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Categories</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Organise your products into categories for the POS grid.
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Category
        </Button>
      </div>

      <CategoryList categories={categories} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Category"
      >
        <CategoryForm
          onSuccess={handleSuccess}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
