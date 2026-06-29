import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PinLockScreen } from "@/components/pos/PinLockScreen"
import { POSWorkspace } from "@/components/pos/POSWorkspace"

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

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })

  return (
    <POSWorkspace
      categories={categories as any}
      branchId={branchId}
    />
  )
}
