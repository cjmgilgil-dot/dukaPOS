"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl sm:max-w-md sm:rounded-2xl",
          "animate-in slide-in-from-bottom-4 sm:zoom-in-95",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              {title}
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-auto"
            aria-label="Close"
          >
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
