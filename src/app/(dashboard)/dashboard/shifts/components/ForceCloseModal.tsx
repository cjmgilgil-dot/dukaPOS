"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, X } from "lucide-react"
import { forceCloseShift } from "../actions"
import { toast } from "sonner"

interface ForceCloseModalProps {
  shiftId: string
  cashierName: string
  onClose: () => void
}

export function ForceCloseModal({ shiftId, cashierName, onClose }: ForceCloseModalProps) {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleForceClose() {
    if (!pin || loading) return
    setLoading(true)
    setError("")
    const result = await forceCloseShift({ shiftId, managerPin: pin })
    setLoading(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    toast.success("Shift force-closed")
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">Force Close Shift</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          This will close <span className="font-medium text-[var(--color-text)]">{cashierName}</span>&apos;s
          shift with zero variance. Enter your manager PIN to confirm.
        </p>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
            Manager PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-center font-mono text-lg tracking-widest text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-xs text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleForceClose}
            disabled={!pin || loading}
            className="flex-1 rounded-xl bg-[var(--color-danger)] py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? "Closing…" : "Force Close"}
          </button>
        </div>
      </div>
    </div>
  )
}
