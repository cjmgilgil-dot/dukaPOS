import { ICON_MAP } from "@/lib/category-icons"
import { cn } from "@/lib/utils"

interface CategoryIconProps {
  icon: string | null | undefined
  color?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: { wrapper: "h-7 w-7", icon: "h-3.5 w-3.5" },
  md: { wrapper: "h-9 w-9", icon: "h-4.5 w-4.5" },
  lg: { wrapper: "h-11 w-11", icon: "h-5 w-5" },
}

export function CategoryIcon({ icon, color, size = "md", className }: CategoryIconProps) {
  const s = sizes[size]
  const bg = color ? `${color}22` : "var(--color-surface-alt)"
  const fg = color ?? "var(--color-text-muted)"

  const LucideIcon = icon ? ICON_MAP.get(icon) : undefined

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        s.wrapper,
        className
      )}
      style={{ backgroundColor: bg }}
    >
      {LucideIcon ? (
        <LucideIcon className={s.icon} style={{ color: fg }} />
      ) : icon ? (
        // Legacy emoji or unknown string
        <span className="text-base leading-none">{icon}</span>
      ) : (
        // No icon at all
        <span className="text-[var(--color-text-muted)] text-xs">—</span>
      )}
    </div>
  )
}
