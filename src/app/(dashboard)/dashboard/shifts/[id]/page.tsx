import { notFound } from "next/navigation"
import { getShiftDetail, generateZReport } from "../actions"
import { ShiftDetail } from "../components/ShiftDetail"
import { shiftDuration } from "@/lib/shift/summary"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function ShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [detailResult, reportResult] = await Promise.all([
    getShiftDetail(id),
    generateZReport(id),
  ])

  if (!detailResult.success || !reportResult.success) notFound()

  const { shift, sales } = detailResult.data
  const report = reportResult.data

  const openedStr = new Date(shift.openedAt).toLocaleString("en-KE", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Link href="/dashboard/shifts" className="flex items-center gap-1 hover:text-[var(--color-text)] transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Shifts
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">{shift.cashierName}</span>
        <span className="text-xs">· {openedStr}</span>
        {shift.status === "OPEN" && (
          <span className="rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-success)]">
            OPEN · {shiftDuration(new Date(shift.openedAt))}
          </span>
        )}
      </div>

      <ShiftDetail
        report={report}
        sales={sales.map(s => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
        }))}
        shiftId={id}
        cashierName={shift.cashierName}
        isOpen={shift.status === "OPEN"}
      />
    </div>
  )
}
