"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORY_ICONS, ICON_GROUPS, ICON_MAP } from "@/lib/category-icons"
import { CategoryIcon } from "./CategoryIcon"

interface IconPickerProps {
  value: string
  color?: string
  onChange: (iconName: string) => void
  label?: string
}

export function IconPicker({ value, color, onChange, label = "Icon" }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return CATEGORY_ICONS.filter((e) =>
      !q ||
      e.label.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.group.toLowerCase().includes(q)
    )
  }, [query])

  const groups = useMemo(() => {
    const g = activeGroup
      ? filtered.filter((e) => e.group === activeGroup)
      : filtered
    return ICON_GROUPS.map((grp) => ({
      group: grp,
      icons: g.filter((e) => e.group === grp),
    })).filter((g) => g.icons.length > 0)
  }, [filtered, activeGroup])

  function select(name: string) {
    onChange(name)
    setOpen(false)
    setQuery("")
  }

  const SelectedIcon = value ? ICON_MAP.get(value) : undefined

  return (
    <div className="flex flex-col gap-1.5" ref={panelRef}>
      {label && (
        <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-lg border bg-[var(--color-surface)] px-3 text-left text-sm transition-colors",
          open
            ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-1 ring-offset-[var(--color-bg)]"
            : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
        )}
      >
        <CategoryIcon icon={value || null} color={color} size="sm" />
        <span className={value ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}>
          {value
            ? (CATEGORY_ICONS.find((e) => e.name === value)?.label ?? value)
            : "Choose an icon…"}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange("") }}
            className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </button>

      {open && (
        <div className="z-50 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
          {/* Search */}
          <div className="border-b border-[var(--color-border)] p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search icons…"
                className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] pl-9 pr-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Group filter tabs */}
          {!query && (
            <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] px-3 py-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveGroup(null)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  !activeGroup
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
                )}
              >
                All
              </button>
              {ICON_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    activeGroup === g
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Icon grid */}
          <div className="max-h-72 overflow-y-auto p-3 space-y-4">
            {groups.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
                No icons match "{query}"
              </p>
            ) : (
              groups.map(({ group, icons }) => (
                <div key={group}>
                  {(!query && !activeGroup) && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                      {group}
                    </p>
                  )}
                  <div className="grid grid-cols-8 gap-1">
                    {icons.map((entry) => {
                      const Icon = entry.icon
                      const isSelected = value === entry.name
                      return (
                        <button
                          key={entry.name}
                          type="button"
                          title={entry.label}
                          onClick={() => select(entry.name)}
                          className={cn(
                            "group flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors",
                            isSelected
                              ? "bg-[var(--color-primary)] text-white"
                              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="hidden text-[10px] leading-none group-hover:block truncate w-full text-center">
                            {entry.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
