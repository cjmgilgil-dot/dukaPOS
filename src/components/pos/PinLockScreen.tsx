"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface PinLockScreenProps {
  branchId: string
}

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "OK"]

export function PinLockScreen({ branchId }: PinLockScreenProps) {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleKey(key: string) {
    if (loading) return

    if (key === "CLR") {
      setPin("")
      setError("")
      return
    }

    if (key === "OK") {
      if (pin.length < 4) {
        setError("PIN must be at least 4 digits")
        return
      }
      handleSubmit()
      return
    }

    if (pin.length >= 6) return
    setError("")
    setPin((prev) => prev + key)
  }

  async function handleSubmit() {
    setLoading(true)
    setError("")

    const result = await signIn("pin", {
      pin,
      branchId,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Incorrect PIN. Try again.")
      setPin("")
    } else {
      router.refresh()
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 p-6">
      {/* Logo */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[var(--color-primary)]">
          DukaPOS
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Enter your PIN to continue
        </p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-all",
              i < pin.length
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                : "border-[var(--color-border)] bg-transparent"
            )}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      )}

      {/* Numeric keypad */}
      <div className="grid w-full grid-cols-3 gap-3">
        {PAD_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => handleKey(key)}
            disabled={loading}
            className={cn(
              "flex h-16 items-center justify-center rounded-xl text-xl font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
              "disabled:pointer-events-none disabled:opacity-50",
              key === "OK"
                ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                : key === "CLR"
                  ? "bg-[var(--color-surface-alt)] text-[var(--color-danger)] hover:bg-[var(--color-border)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] active:scale-95"
            )}
          >
            {loading && key === "OK" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              key
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
