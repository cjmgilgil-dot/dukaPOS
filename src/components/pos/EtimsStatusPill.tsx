"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface EtimsStatus {
  queueDepth: number
  failedCount: number
  lastSuccessAt: string | null
}

export function EtimsStatusPill() {
  const [status, setStatus] = useState<EtimsStatus | null>(null)

  async function fetchStatus() {
    try {
      const res = await fetch("/api/etims/status", { cache: "no-store" })
      if (res.ok) setStatus(await res.json())
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!status) return null

  const { queueDepth, failedCount } = status

  const color = failedCount > 0
    ? "bg-[var(--color-danger)]"
    : queueDepth > 0
      ? "bg-amber-400"
      : "bg-[var(--color-success)]"

  const label = failedCount > 0
    ? `eTIMS ✗`
    : queueDepth > 0
      ? `eTIMS (${queueDepth})`
      : "eTIMS"

  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
    </div>
  )
}
