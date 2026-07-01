import Link from "next/link"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { shiftDuration } from "@/lib/shift/summary"
import { Clock } from "lucide-react"

export async function OpenShiftsWidget() {
  const session = await auth()
  const branchId = session?.user?.branchId
  if (!branchId) return null

  const openShifts = await db.shift.findMany({
    where: { branchId, status: "OPEN" },
    include: {
      user: { select: { name: true } },
      _count: { select: { sales: { where: { status: "COMPLETED" } } } },
    },
    orderBy: { openedAt: "asc" },
  })

  if (openShifts.length === 0) return null

  return (
    <div className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse" />
        <h3 className="text-sm font-semibold text-[var(--color-text)]">
          {openShifts.length} Open Shift{openShifts.length !== 1 ? "s" : ""}
        </h3>
      </div>
      <div className="space-y-2">
        {openShifts.map(s => (
          <div key={s.id} className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] px-3 py-2">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">{s.user.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {shiftDuration(s.openedAt)} · {s._count.sales} sales
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/shifts/${s.id}`}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
