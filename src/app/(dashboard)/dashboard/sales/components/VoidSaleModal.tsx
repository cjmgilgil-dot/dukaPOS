"use client"

import { useState } from "react"
import { ManagerPinModal } from "@/components/pos/ManagerPinModal"
import { voidSale } from "@/app/(dashboard)/dashboard/sales/actions"
import { toast } from "sonner"

interface VoidSaleModalProps {
  isOpen: boolean
  saleId: string
  saleNumber: string
  onClose: () => void
  onVoided: () => void
}

export function VoidSaleModal({ isOpen, saleId, saleNumber, onClose, onVoided }: VoidSaleModalProps) {
  const [reason, setReason] = useState("")
  const [pinOpen, setPinOpen] = useState(false)
  const [voiding, setVoiding] = useState(false)

  function handleProceed() {
    if (!reason.trim()) return
    setPinOpen(true)
  }

  async function handlePinSuccess(managerId: string) {
    setPinOpen(false)
    setVoiding(true)
    const result = await voidSale(saleId, reason.trim(), managerId)
    setVoiding(false)
    if (result.success) {
      toast.success("Sale voided")
      setReason("")
      onVoided()
    } else {
      toast.error(result.error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl animate-in zoom-in-95">
          <h2 className="mb-1 font-semibold text-[var(--color-text)]">Void Sale</h2>
          <p className="mb-4 font-mono text-xs text-[var(--color-text-muted)]">{saleNumber}</p>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]">
              Reason for void *
            </label>
            <textarea
              autoFocus
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Customer return, incorrect item, etc."
              rows={3}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2.5 text-sm text-[var(--color-text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)]"
            />
          </div>

          <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-4 py-3 mb-4">
            <p className="text-xs text-[var(--color-danger)]">
              This will reverse all stock changes and attempt to refund digital payments. This action requires manager authorization.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={!reason.trim() || voiding}
              className="flex-1 rounded-xl bg-[var(--color-danger)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-colors"
            >
              {voiding ? "Voiding..." : "Void Sale"}
            </button>
          </div>
        </div>
      </div>

      <ManagerPinModal
        isOpen={pinOpen}
        title="Void Authorization"
        description="Manager PIN required to void this sale"
        onSuccess={(id) => handlePinSuccess(id)}
        onCancel={() => setPinOpen(false)}
      />
    </>
  )
}
