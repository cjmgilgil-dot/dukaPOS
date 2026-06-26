import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)]">
          Welcome back, {session?.user.name}
        </h2>
        <p className="mt-1 text-[var(--color-text-muted)]">
          Here&apos;s an overview of your shop.
        </p>
      </div>

      {/* Placeholder stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Today's Sales", "Items Sold", "Active Shifts", "Low Stock"].map(
          (label) => (
            <div
              key={label}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[var(--color-text)]">
                —
              </p>
            </div>
          )
        )}
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        Dashboard content coming in Phase 1.
      </p>
    </div>
  )
}
