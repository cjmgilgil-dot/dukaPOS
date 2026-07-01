import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PinLockScreen } from "@/components/pos/PinLockScreen"
import { POSPageShell } from "@/components/pos/POSPageShell"
import type { ActiveShift } from "@/lib/shift/types"

export default async function POSPage() {
  const session = await auth()

  const branchId =
    session?.user?.branchId ||
    (
      await db.branch.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      })
    )?.id

  if (!branchId) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]">
        No active branch found. Ask an owner to set up a branch first.
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex h-full items-center justify-center">
        <PinLockScreen branchId={branchId} />
      </div>
    )
  }

  const [categories, openShift, branch] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.shift.findFirst({
      where: { userId: session.user.id, branchId, status: "OPEN" },
    }),
    db.branch.findUnique({ where: { id: branchId }, select: { name: true } }),
  ])

  const sales = openShift
    ? await db.sale.findMany({
        where: { shiftId: openShift.id, status: "COMPLETED" },
        include: { payments: { where: { method: "CASH" } } },
      })
    : []
  const cashTotal = sales
    .flatMap(s => s.payments)
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const initialShift: ActiveShift | null = openShift
    ? {
        id: openShift.id,
        openedAt: openShift.openedAt,
        openingFloat: Number(openShift.openingFloat),
        salesCount: sales.length,
        cashTotal,
      }
    : null

  return (
    <POSPageShell
      branchId={branchId}
      categories={categories}
      initialShift={initialShift}
      cashierName={session.user.name ?? "Cashier"}
      branchName={branch?.name ?? "Branch"}
    />
  )
}
