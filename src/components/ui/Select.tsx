import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-lg border bg-[var(--color-surface)] text-[var(--color-text)]",
            "h-12 px-3 text-base appearance-none",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 focus:ring-offset-[var(--color-bg)]",
            error
              ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
              : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = "Select"
