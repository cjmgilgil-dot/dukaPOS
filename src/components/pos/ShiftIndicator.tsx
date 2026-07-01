"use client"

import { useEffect, useRef, useState } from "react"
import { Clock, AlertTriangle, X } from "lucide-react"
import { getActiveShift } from "@/app/(pos)/pos/actions"
import { ShiftClose } from "./ShiftClose"
import { cn } from "@/lib/utils"
import type { ActiveShift } from "@/lib/shift/types"
import { shiftDuration } from "@/lib/shift/utils"

function fmtKes(n: number) {
  return `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`
}

interface ShiftIndicatorProps {
  initialShift: ActiveShift | null
  cashierName: string
}

export function ShiftIndicator({ initialShift, cashierName }: ShiftIndicatorProps) {
  const [shift, setShift] = useState<ActiveShift | null>(initialShift)
  const [duration, setDuration] = useState(
    initialShift ? shiftDuration(new Date(initialShift.openedAt)) : ""
  )
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showXReport, setShowXReport] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Poll active shift every 60s
  useEffect(() => {
    const poll = async () => {
      const res = await getActiveShift()
      if (res.success) setShift(res.data)
    }
    const interval = setInterval(poll, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Update duration every minute
  useEffect(() => {
    if (!shift) return
    const update = () => {
      setDuration(shiftDuration(new Date(shift.openedAt)))
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [shift])

  // Close popover on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    if (popoverOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [popoverOpen])

  if (!shift) {
    return (
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-xs text-amber-400">No shift</span>
      </div>
    )
  }

  const openedAt = new Date(shift.openedAt)
  const openedStr = openedAt.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true })

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setPopoverOpen(v => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-[var(--color-surface-alt)]",
          popoverOpen ? "bg-[var(--color-surface-alt)]" : ""
        )}
      >
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
        <Clock className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
        <span className="text-[var(--color-text-muted)]">{duration}</span>
      </button>

      {popoverOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--color-text)]">Current Shift</span>
            <button
              onClick={() => setPopoverOpen(false)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Opened</span>
              <span className="text-[var(--color-text)]">{openedStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Duration</span>
              <span className="text-[var(--color-text)]">{duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Float</span>
              <span className="font-mono text-[var(--color-text)]">{fmtKes(shift.openingFloat)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Sales</span>
              <span className="text-[var(--color-text)]">{shift.salesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Cash sales</span>
              <span className="font-mono text-[var(--color-text)]">{fmtKes(shift.cashTotal)}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-[var(--color-border)] p-3">
            <button
              onClick={() => { setShowXReport(true); setPopoverOpen(false) }}
              className="w-full rounded-lg px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors"
            >
              X-Report (Mid-shift)
            </button>
            <button
              onClick={() => { setShowClose(true); setPopoverOpen(false) }}
              className="w-full rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-xs font-semibold text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20 transition-colors"
            >
              Close Shift
            </button>
          </div>
        </div>
      )}

      {showClose && (
        <ShiftClose
          shiftId={shift.id}
          openedAt={new Date(shift.openedAt)}
          openingFloat={shift.openingFloat}
          cashierName={cashierName}
          onCancel={() => setShowClose(false)}
          onClosed={() => setShowClose(false)}
        />
      )}

      {showXReport && (
        <XReportOverlay shiftId={shift.id} onClose={() => setShowXReport(false)} />
      )}
    </div>
  )
}

function XReportOverlay({ shiftId, onClose }: { shiftId: string; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/shifts/${shiftId}/x-report`)
      .then(r => r.text())
      .then(setHtml)
      .catch(() => setHtml("<p>Failed to load report</p>"))
  }, [shiftId])

  async function handlePrint() {
    if (!html) return
    const { printReceipt } = await import("@/lib/receipt/print-manager")
    await printReceipt(html)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">X-Report (Mid-Shift)</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              Print
            </button>
            <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {html ? (
            <iframe
              srcDoc={html}
              title="X-Report"
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
