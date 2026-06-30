import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { Package, Layers, AlertTriangle, Archive, TrendingUp, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await auth()
  const branchId = session?.user?.branchId ?? ""

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const branchFilter = branchId ? { branchId } : {}

  const [productCount, categoryCount, allStocks, todaySales, recentSales] = await Promise.all([
    db.product.count({ where: { isActive: true, isDeleted: false } }).catch(() => 0),
    db.category.count({ where: { isActive: true } }).catch(() => 0),
    db.productStock.findMany({ where: branchFilter, select: { quantity: true, reorderLevel: true } }).catch(() => []),
    db.sale.aggregate({
      where: { ...branchFilter, status: "COMPLETED", createdAt: { gte: todayStart } },
      _sum: { total: true },
      _count: { id: true },
    }).catch(() => ({ _sum: { total: null }, _count: { id: 0 } })),
    db.sale.findMany({
      where: { ...branchFilter, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        saleNumber: true,
        total: true,
        createdAt: true,
        customer: { select: { name: true } },
        payments: { select: { method: true } },
      },
    }).catch(() => []),
  ])

  const lowStock = allStocks.filter(s => Number(s.quantity) <= Number(s.reorderLevel)).length
  const totalUnits = allStocks.reduce((sum, s) => sum + Number(s.quantity), 0)
  const todayRevenue = Number(todaySales._sum?.total ?? 0)
  const todayCount = todaySales._count?.id ?? 0

  const METHOD_LABELS: Record<string, string> = {
    CASH: "Cash", MPESA: "M-Pesa", CARD: "Card", BANK_TRANSFER: "Bank",
  }

  const statCards = [
    {
      label: "Active Products",
      value: productCount.toLocaleString(),
      icon: Package,
      color: "text-[var(--color-info)]",
      bg: "bg-blue-500/10",
    },
    {
      label: "Categories",
      value: categoryCount.toLocaleString(),
      icon: Layers,
      color: "text-[var(--color-primary)]",
      bg: "bg-orange-500/10",
    },
    {
      label: "Low / Out of Stock",
      value: lowStock.toLocaleString(),
      icon: AlertTriangle,
      color: lowStock > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]",
      bg: lowStock > 0 ? "bg-yellow-500/10" : "bg-green-500/10",
    },
    {
      label: "Total Stock Units",
      value: totalUnits.toLocaleString(undefined, { maximumFractionDigits: 0 }),
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

      {/* Today's sales summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <TrendingUp className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Today&apos;s Revenue</p>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-[var(--color-text)]">
            {formatCurrency(todayRevenue)}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <ShoppingCart className="h-5 w-5 text-[var(--color-success)]" />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">Sales Today</p>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-[var(--color-text)]">
            {todayCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent sales */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Recent Sales</h3>
          <Link href="/dashboard/sales" className="text-xs text-[var(--color-primary)] hover:underline">
            View all
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-[var(--color-text-muted)]">No sales yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {recentSales.map(sale => {
              const methods = [...new Set(sale.payments.map(p => p.method))]
                .map(m => METHOD_LABELS[m] ?? m)
                .join(" + ")
              const timeStr = new Date(sale.createdAt).toLocaleTimeString("en-KE", {
                hour: "2-digit", minute: "2-digit", hour12: true,
              })
              return (
                <li key={sale.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[var(--color-text-muted)]">{sale.saleNumber}</p>
                    <p className="truncate text-sm text-[var(--color-text)]">
                      {sale.customer?.name ?? "Walk-in"}
                      {methods && (
                        <span className="ml-2 text-xs text-[var(--color-text-muted)]">· {methods}</span>
                      )}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold text-[var(--color-text)]">
                      {formatCurrency(Number(sale.total))}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{timeStr}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
