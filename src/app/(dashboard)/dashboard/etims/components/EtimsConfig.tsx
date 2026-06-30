"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { triggerTestConnection, triggerSyncCodes } from "@/app/(dashboard)/dashboard/etims/actions"
import { toast } from "sonner"

interface EtimsConfigProps {
  environment: string
  tin: string
  branchId: string
  deviceSerial: string
  isMockMode: boolean
  lastCodeSync: Date | null
}

export function EtimsConfig({ environment, tin, branchId, deviceSerial, isMockMode, lastCodeSync }: EtimsConfigProps) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [syncing, setSyncing] = useState(false)

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    const result = await triggerTestConnection()
    setTesting(false)
    setTestResult({ success: result.success, message: result.success ? result.data : result.error })
  }

  async function handleSyncCodes() {
    setSyncing(true)
    const result = await triggerSyncCodes()
    setSyncing(false)
    if (result.success) toast.success("KRA code lists synced")
    else toast.error(result.error)
  }

  const configRows = [
    { label: "Environment", value: environment.toUpperCase() },
    { label: "Taxpayer PIN (TIN)", value: tin || "Not configured" },
    { label: "Branch ID (bhfId)", value: branchId || "00" },
    { label: "Device Serial", value: deviceSerial || "Not configured" },
    { label: "Mode", value: isMockMode ? "Mock (dev)" : "Live" },
  ]

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="mb-4 font-semibold text-[var(--color-text)]">Configuration</h3>

      <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] mb-4">
        {configRows.map(row => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-[var(--color-text-muted)]">{row.label}</span>
            <span className={`font-mono text-sm font-medium ${!row.value.includes("Not") ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {isMockMode && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-xs text-amber-400">
            Running in mock mode — set ETIMS_USERNAME and ETIMS_PASSWORD to activate live KRA integration.
          </p>
        </div>
      )}

      {testResult && (
        <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
          testResult.success ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
        }`}>
          {testResult.success
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />
          }
          {testResult.message}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-colors"
        >
          {testing && <Loader2 className="h-4 w-4 animate-spin" />}
          Test Connection
        </button>
        <button
          onClick={handleSyncCodes}
          disabled={syncing}
          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-colors"
        >
          {syncing && <Loader2 className="h-4 w-4 animate-spin" />}
          Sync KRA Codes
          {lastCodeSync && (
            <span className="text-xs text-[var(--color-text-muted)]">
              (last: {new Date(lastCodeSync).toLocaleDateString()})
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
