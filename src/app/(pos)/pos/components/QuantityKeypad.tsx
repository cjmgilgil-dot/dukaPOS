"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface QuantityKeypadProps {
  isOpen: boolean
  label: string
  initialValue?: number
  onConfirm: (value: number) => void
  onClose: () => void
  min?: number
  max?: number
  allowDecimal?: boolean
}

const PAD_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"]

export function QuantityKeypad({
  isOpen,
  label,
  initialValue = 1,
  onConfirm,
  onClose,
  min = 0.01,
  max = 99999,
  allowDecimal = true,
}: QuantityKeypadProps) {
  const [display, setDisplay] = useState(String(initialValue))

  useEffect(() => {
    if (isOpen) setDisplay(String(initialValue))
  }, [isOpen, initialValue])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "Enter") handleConfirm()
      else if (e.key === "Backspace") handleKey("⌫")
      else if (/^\d$/.test(e.key)) handleKey(e.key)
      else if (e.key === "." && allowDecimal) handleKey(".")
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  })

  function handleKey(key: string) {
    if (key === "⌫") {
      setDisplay(prev => (prev.length <= 1 ? "0" : prev.slice(0, -1)))
      return
    }
    if (key === ".") {
      if (!allowDecimal || display.includes(".")) return
      setDisplay(prev => prev + ".")
      return
    }
    setDisplay(prev => {
      const next = prev === "0" ? key : prev + key
      if (next.length > 8) return prev
      return next
    })
  }

  function handleConfirm() {
    const val = parseFloat(display)
    if (isNaN(val) || val < min) { onConfirm(min); return }
    onConfirm(Math.min(val, max))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xs rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl animate-in zoom-in-95">
        <p className="mb-2 text-center text-sm text-[var(--color-text-muted)]">{label}</p>

        {/* Display */}
        <div className="mb-4 rounded-xl bg-[var(--color-surface-alt)] px-4 py-3 text-center">
          <span className="font-mono text-3xl font-bold text-[var(--color-text)]">{display}</span>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {PAD_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              disabled={!allowDecimal && key === "."}
              className={cn(
                "flex h-14 items-center justify-center rounded-xl text-xl font-semibold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                "disabled:opacity-30 disabled:pointer-events-none",
                key === "⌫"
                  ? "bg-[var(--color-surface-alt)] text-[var(--color-danger)] hover:bg-[var(--color-border)]"
                  : "bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)] active:scale-95"
              )}
            >
              {key}
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          className="mt-3 w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Confirm
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-lg py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
