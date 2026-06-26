import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "primary"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]",
  primary:
    "bg-orange-500/20 text-[var(--color-primary)]",
  success:
    "bg-green-500/20 text-[var(--color-success)]",
  warning:
    "bg-yellow-500/20 text-[var(--color-warning)]",
  danger:
    "bg-red-500/20 text-[var(--color-danger)]",
  info:
    "bg-blue-500/20 text-[var(--color-info)]",
}

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
