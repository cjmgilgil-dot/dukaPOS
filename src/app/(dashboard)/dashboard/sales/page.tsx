import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SalesTable } from "./components/SalesTable"

interface SalesPageProps {
  searchParams: Promise<{ q?: string; date?: string; status?: string; page?: string }>
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const session = await auth()
  const { branchId } = session!.user
  const { q, date, status, page } = await searchParams

  const pageNum = Math.max(1, parseInt(page ?? "1"))
  const pageSize = 50
  const skip = (pageNum - 1) * pageSize

  const today = new Date()
  const selectedDate = date ? new Date(date) : today
  const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
  const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1)

  const [sales, total] = await Promise.all([
    db.sale.findMany({
      where: {
        branchId: branchId ?? undefined,
        status: status ? (status as any) : { not: "HELD" },
        createdAt: { gte: startOfDay, lt: endOfDay },
        ...(q ? {
          OR: [
            { saleNumber: { contains: q, mode: "insensitive" } },
            { customer: { name: { contains: q, mode: "insensitive" } } },
          ],
        } : {}),
      },
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
        payments: { select: { method: true, amount: true } },
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.sale.count({
      where: {
        branchId: branchId ?? undefined,
        status: status ? (status as any) : { not: "HELD" },
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
    }),
  ])

  // Today's stats
  const todayTotal = await db.sale.aggregate({
    _sum: { total: true },
    where: { branchId: branchId ?? undefined, status: "COMPLETED", createdAt: { gte: startOfDay, lt: endOfDay } },
  })

  const dateStr = selectedDate.toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Sales</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{dateStr}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-right">
          <p className="text-xs text-[var(--color-text-muted)]">Today's Revenue</p>
          <p className="font-mono text-xl font-bold text-[var(--color-primary)]">
            KES {Number(todayTotal._sum.total ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search sale # or customer..."
          className="w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <input
          type="date"
          name="date"
          defaultValue={date ?? today.toISOString().slice(0, 10)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">All (excl. held)</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOIDED">Voided</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <Suspense fallback={<div className="text-sm text-[var(--color-text-muted)]">Loading...</div>}>
        <SalesTable sales={sales as any} />
      </Suspense>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[var(--color-text-muted)]">{total} sales total</p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a
                href={`?q=${q ?? ""}&date=${date ?? ""}&status=${status ?? ""}&page=${pageNum - 1}`}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                Previous
              </a>
            )}
            {pageNum < totalPages && (
              <a
                href={`?q=${q ?? ""}&date=${date ?? ""}&status=${status ?? ""}&page=${pageNum + 1}`}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
