"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { IconPicker } from "@/components/ui/IconPicker"
import { createCategory, updateCategory } from "@/app/(dashboard)/dashboard/categories/actions"
import type { Category } from "@/lib/generated/prisma"

interface CategoryFormProps {
  category?: Category | null
  onSuccess: () => void
  onCancel: () => void
}

type FormState = { success: true } | { success: false; error: string } | null

function buildAction(category: Category | null | undefined) {
  if (category) {
    return async (prev: FormState, formData: FormData) =>
      updateCategory(category.id, formData)
  }
  return async (prev: FormState, formData: FormData) => createCategory(formData)
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const action = buildAction(category)
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null)
  const [icon, setIcon] = useState(category?.icon ?? "")
  const [color, setColor] = useState(category?.color ?? "#e87722")

  useEffect(() => {
    if (!state) return
    if (state.success) {
      toast.success(category ? "Category updated" : "Category created")
      onSuccess()
    } else {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Name"
        name="name"
        defaultValue={category?.name ?? ""}
        placeholder="e.g. Electrical"
        required
      />

      {/* Icon picker — writes selected value into a hidden input */}
      <IconPicker
        label="Icon"
        value={icon}
        color={color}
        onChange={setIcon}
      />
      <input type="hidden" name="icon" value={icon} />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text)]">
          Colour
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-12 w-20 cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
          />
          <span className="font-mono text-sm text-[var(--color-text-muted)]">{color}</span>
        </div>
        <input type="hidden" name="color" value={color} />
      </div>

      <Input
        label="Sort Order"
        name="sortOrder"
        type="number"
        defaultValue={category?.sortOrder ?? 0}
        min={0}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : category ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}
