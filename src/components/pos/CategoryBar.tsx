"use client"

import { cn } from "@/lib/utils"
import { ICON_MAP } from "@/lib/category-icons"

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
}

interface CategoryBarProps {
  categories: Category[]
  selected: string
  onSelect: (id: string) => void
}

export function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect("")}
        className={cn(
          "flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
          !selected
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
        )}
      >
        All
      </button>
      {categories.map((c) => {
        const isActive = selected === c.id
        const LucideIcon = c.icon ? ICON_MAP.get(c.icon) : undefined

        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
              isActive
                ? "text-white"
                : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
            )}
            style={isActive ? { backgroundColor: c.color ?? "var(--color-primary)" } : undefined}
          >
            {LucideIcon ? (
              <LucideIcon className="h-3.5 w-3.5 shrink-0" />
            ) : c.icon ? (
              <span className="text-sm leading-none">{c.icon}</span>
            ) : null}
            {c.name}
          </button>
        )
      })}
    </div>
  )
}
