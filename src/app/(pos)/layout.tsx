import Script from "next/script"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { POSHeaderActions } from "@/components/pos/POSHeaderActions"
import { EtimsStatusPill } from "@/components/pos/EtimsStatusPill"
import { ShiftIndicator } from "@/components/pos/ShiftIndicator"
import type { ActiveShift } from "@/lib/shift/types"

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = session?.user

  let initialShift: ActiveShift | null = null
  if (user?.id && user.branchId) {
    const shift = await db.shift.findFirst({
      where: { userId: user.id, branchId: user.branchId, status: "OPEN" },
    })
    if (shift) {
      const sales = await db.sale.findMany({
        where: { shiftId: shift.id, status: "COMPLETED" },
        include: { payments: { where: { method: "CASH" } } },
      })
      initialShift = {
        id: shift.id,
        openedAt: shift.openedAt,
        openingFloat: Number(shift.openingFloat),
        salesCount: sales.length,
        cashTotal: sales.flatMap(s => s.payments).reduce((s, p) => s + Number(p.amount), 0),
      }
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="flex h-12 items-center justify-between border-b border-[var(--color-surface-alt)] bg-[var(--color-surface)] px-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[var(--color-primary)]">DukaPOS</span>
          {user && (
            <>
              <span className="text-xs text-[var(--color-text-muted)]">|</span>
              <span className="text-xs text-[var(--color-text-muted)]">{user.name}</span>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-[var(--color-primary)]">
                {user.role}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
            <span className="text-xs text-[var(--color-text-muted)]">Online</span>
          </div>
          {user && (
            <ShiftIndicator
              initialShift={initialShift}
              cashierName={user.name ?? "Cashier"}
            />
          )}
          <EtimsStatusPill />
          {user && <POSHeaderActions />}
        </div>
      </header>
      <main className="h-[calc(100vh-3rem)]">{children}</main>
      <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />
    </div>
  )
}
