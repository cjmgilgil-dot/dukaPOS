import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PinLockScreen } from "@/components/pos/PinLockScreen"

export default async function POSPage() {
  const session = await auth()

  // Use authenticated user's branch, or fall back to the first active branch
  // so unauthenticated cashiers can still reach the PIN screen
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

  return (
    <div className="flex h-full items-center justify-center">
      <PinLockScreen branchId={branchId} />
    </div>
  )
}
