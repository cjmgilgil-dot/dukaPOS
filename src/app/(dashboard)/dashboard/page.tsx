import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Package, Layers, AlertTriangle, Archive } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  const branchId = session?.user?.branchId ?? ""

  async function getStats() {
    const [productCount, categoryCount, allStocks] = await Promise.all([
      db.product.count({ where: { isActive: true, isDeleted: false } }),
      db.category.count({ where: { isActive: true } }),
      db.productStock.findMany({
        where: branchId ? { branchId } : {},
        select: { quantity: true, reorderLevel: true },
      }),
    ])

    const lowStock = allStocks.filter(
      (s) => Number(s.quantity) <= Number(s.reorderLevel)
    ).length

    const totalUnits = allStocks.reduce((sum, s) => sum + Number(s.quantity), 0)

    return { productCount, categoryCount, lowStock, totalUnits }
  }

  const stats = await getStats().catch(() => ({
    productCount: 0, categoryCount: 0, lowStock: 0, totalUnits: 0,
  }))

  const statCards = [
    {
      label: "Active Products",
      value: stats.productCount.toLocaleString(),
      icon: Package,
      color: "text-[var(--color-info)]",
      bg: "bg-blue-500/10",
    },
    {
      label: "Categories",
      value: stats.categoryCount.toLocaleString(),
      icon: Layers,
      color: "text-[var(--color-primary)]",
      bg: "bg-orange-500/10",
    },
    {
      label: "Low / Out of Stock",
      value: stats.lowStock.toLocaleString(),
      icon: AlertTriangle,
      color: stats.lowStock > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]",
      bg: stats.lowStock > 0 ? "bg-yellow-500/10" : "bg-green-500/10",
    },
    {
      label: "Total Stock Units",
      value: stats.totalUnits.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      icon: Archive,
      color: "text-[var(--color-success)]",
      bg: "bg-green-500/10",
    },
  ]

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-[var(--color-text)]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="text-sm font-medium text-[var(--color-text-muted)]">
          Sales dashboard coming in Phase 2.
        </p>
      </div>
    </div>
  )
}
