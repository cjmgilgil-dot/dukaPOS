import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-lg border bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)]",
            "px-3 py-2.5 text-base resize-y min-h-[96px]",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 focus:ring-offset-[var(--color-bg)]",
            error
              ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
              : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"
