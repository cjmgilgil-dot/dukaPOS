"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, CheckCheck, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { retryQueueItem, markQueueItemSent, retryAllFailed, triggerQueueProcess } from "@/app/(dashboard)/dashboard/etims/actions"
import { toast } from "sonner"

interface QueueItem {
  id: string
  saleId: string
  status: string
  attempts: number
  lastError: string | null
  createdAt: Date
  sentAt: Date | null
  sale: { saleNumber: string }
}

interface EtimsQueueTableProps {
  items: QueueItem[]
  failedCount: number
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400",
  RETRYING: "bg-blue-500/10 text-blue-400",
  FAILED: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  SENT: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
}

export function EtimsQueueTable({ items, failedCount }: EtimsQueueTableProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [payloadView, setPayloadView] = useState<string | null>(null)

  async function handleProcessQueue() {
    setProcessing(true)
    const result = await triggerQueueProcess()
    setProcessing(false)
    if (result.success) {
      toast.success(`Processed ${result.data.processed}: ${result.data.succeeded} sent, ${result.data.failed} failed`)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleRetry(id: string) {
    const result = await retryQueueItem(id)
    if (result.success) { toast.success("Marked for retry"); router.refresh() }
    else toast.error(result.error)
  }

  async function handleMarkSent(id: string) {
    const result = await markQueueItemSent(id)
    if (result.success) { toast.success("Marked as sent"); router.refresh() }
    else toast.error(result.error)
  }

  async function handleRetryAll() {
    const result = await retryAllFailed()
    if (result.success) { toast.success(`Reset ${result.data} failed items`); router.refresh() }
    else toast.error(result.error)
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-[var(--color-text)]">Queue</h3>
        <div className="flex gap-2">
          {failedCount > 0 && (
            <button
              onClick={handleRetryAll}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              Retry All Failed ({failedCount})
            </button>
          )}
          <button
            onClick={handleProcessQueue}
            disabled={processing}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
          >
            {processing ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Process Now
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">Queue is empty</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                {["Sale #", "Status", "Attempts", "Last Error", "Queued", ""].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {items.map(item => (
                <tr key={item.id} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs text-[var(--color-text-muted)]">{item.sale.saleNumber}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[item.status] ?? "")}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{item.attempts}</td>
                  <td className="px-3 py-2.5 max-w-xs truncate text-xs text-[var(--color-danger)]">
                    {item.lastError ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)]">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {item.status !== "SENT" && (
                        <button
                          onClick={() => handleRetry(item.id)}
                          className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                          title="Retry"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {item.status === "FAILED" && (
                        <button
                          onClick={() => handleMarkSent(item.id)}
                          className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-success)] transition-colors"
                          title="Mark as sent"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
