import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
}

export function Spinner({ size = "md", label, className }: SpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-[var(--color-surface-alt)] border-t-[var(--color-primary)]",
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
      )}
    </div>
  )
}
