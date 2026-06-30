import { formatCurrency } from "@/lib/utils"

interface HistoryRow {
  id: string
  sale: { saleNumber: string; total: number; createdAt: Date }
  sentAt: Date | null
}

interface EtimsHistoryProps {
  submissions: HistoryRow[]
  todayCount: number
}

export function EtimsHistory({ submissions, todayCount }: EtimsHistoryProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-[var(--color-text)]">Submission History</h3>
        <span className="rounded-full bg-[var(--color-success)]/10 px-3 py-1 text-xs font-medium text-[var(--color-success)]">
          {todayCount} today
        </span>
      </div>

      {submissions.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">No submissions yet</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                {["Sale #", "Sale Total", "Sale Date", "Submitted"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {submissions.map(row => (
                <tr key={row.id} className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs text-[var(--color-text-muted)]">{row.sale.saleNumber}</td>
                  <td className="px-3 py-2.5 font-mono text-sm font-medium text-[var(--color-text)]">
                    {formatCurrency(Number(row.sale.total))}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)]">
                    {new Date(row.sale.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)]">
                    {row.sentAt ? new Date(row.sentAt).toLocaleString() : "—"}
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
