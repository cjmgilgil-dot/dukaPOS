import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  inputSize?: "md" | "lg"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, inputSize = "md", className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)]",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 focus:ring-offset-[var(--color-bg)]",
            error
              ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]"
              : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]",
            inputSize === "lg" ? "h-14 px-4 text-lg" : "h-12 px-3 text-base",
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

Input.displayName = "Input"
