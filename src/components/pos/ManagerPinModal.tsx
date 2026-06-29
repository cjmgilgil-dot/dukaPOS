"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { verifyManagerPin } from "@/app/(pos)/pos/actions"

interface ManagerPinModalProps {
  isOpen: boolean
  onSuccess: (managerId: string, managerName: string) => void
  onCancel: () => void
  title?: string
  description?: string
}

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "OK"]
const MAX_ATTEMPTS = 3
const LOCKOUT_SECONDS = 30

export function ManagerPinModal({
  isOpen,
  onSuccess,
  onCancel,
  title = "Manager Authorization",
  description = "Enter manager PIN to continue",
}: ManagerPinModalProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setPin("")
      setError("")
      setShake(false)
      setAttempts(0)
      setLockedUntil(null)
      setCountdown(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (lockedUntil === null) return
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockedUntil(null)
        setCountdown(0)
        setAttempts(0)
        setError("")
        if (intervalRef.current) clearInterval(intervalRef.current)
      } else {
        setCountdown(remaining)
      }
    }
    tick()
    intervalRef.current = setInterval(tick, 500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [lockedUntil])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onCancel])

  const isLocked = lockedUntil !== null

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  function handleKey(key: string) {
    if (loading || isLocked) return
    if (key === "CLR") { setPin(""); setError(""); return }
    if (key === "OK") { handleSubmit(); return }
    if (pin.length >= 6) return
    setError("")
    setPin(p => p + key)
  }

  async function handleSubmit() {
    if (pin.length < 4) { setError("PIN must be at least 4 digits"); triggerShake(); return }
    setLoading(true)
    setError("")
    const result = await verifyManagerPin(pin)
    setLoading(false)
    if (result.success) {
      onSuccess(result.data.managerId, result.data.managerName)
      setPin("")
      setAttempts(0)
    } else {
      const next = attempts + 1
      setAttempts(next)
      setPin("")
      triggerShake()
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000)
        setError(`Too many attempts. Locked for ${LOCKOUT_SECONDS}s.`)
      } else {
        setError(`Invalid PIN. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next !== 1 ? "s" : ""} remaining.`)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in zoom-in-95">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
        </div>

        {/* PIN dots */}
        <div className={cn("flex justify-center gap-4 mb-4", shake && "animate-[shake_0.5s_ease-in-out]")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-3.5 w-3.5 rounded-full border-2 transition-all",
                i < pin.length
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                  : "border-[var(--color-border)] bg-transparent"
              )}
            />
          ))}
        </div>

        {/* Error / lockout */}
        {isLocked ? (
          <p className="mb-4 text-center text-sm font-medium text-[var(--color-danger)]">
            Locked — try again in {countdown}s
          </p>
        ) : error ? (
          <p className="mb-4 text-center text-sm text-[var(--color-danger)]">{error}</p>
        ) : (
          <div className="mb-4 h-5" />
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {PAD_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              disabled={loading || isLocked}
              className={cn(
                "flex h-14 items-center justify-center rounded-xl text-lg font-semibold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                "disabled:pointer-events-none disabled:opacity-50",
                key === "OK"
                  ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                  : key === "CLR"
                    ? "bg-[var(--color-surface-alt)] text-[var(--color-danger)] hover:bg-[var(--color-border)]"
                    : "bg-[var(--color-surface-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)] active:scale-95"
              )}
            >
              {loading && key === "OK" ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : key}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="mt-4 w-full rounded-lg py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
