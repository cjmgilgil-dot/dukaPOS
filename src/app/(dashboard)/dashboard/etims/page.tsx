import { db } from "@/lib/db"
import { EtimsConfig } from "./components/EtimsConfig"
import { EtimsQueueTable } from "./components/EtimsQueueTable"
import { EtimsHistory } from "./components/EtimsHistory"

export default async function EtimsPage() {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const [queueItems, sentItems, codeCache, failedCount, todayCount] = await Promise.all([
    db.etimsQueue.findMany({
      where: { status: { not: "SENT" } },
      include: { sale: { select: { saleNumber: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.etimsQueue.findMany({
      where: { status: "SENT" },
      include: { sale: { select: { saleNumber: true, total: true, createdAt: true } } },
      orderBy: { sentAt: "desc" },
      take: 50,
    }),
    db.etimsCodeCache.findUnique({ where: { codeType: "CODE_LIST" } }),
    db.etimsQueue.count({ where: { status: "FAILED" } }),
    db.etimsQueue.count({ where: { status: "SENT", sentAt: { gte: startOfDay } } }),
  ])

  const isMockMode = !process.env.ETIMS_USERNAME || !process.env.ETIMS_PASSWORD

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">KRA eTIMS</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Electronic Tax Invoice Management System</p>
      </div>

      <EtimsConfig
        environment={process.env.ETIMS_ENVIRONMENT ?? "sandbox"}
        tin={process.env.ETIMS_TIN ?? ""}
        branchId={process.env.ETIMS_BRANCH_ID ?? "00"}
        deviceSerial={process.env.ETIMS_DEVICE_SERIAL ?? ""}
        isMockMode={isMockMode}
        lastCodeSync={codeCache?.lastSyncAt ?? null}
      />

      <EtimsQueueTable
        items={queueItems as any}
        failedCount={failedCount}
      />

      <EtimsHistory
        submissions={sentItems as any}
        todayCount={todayCount}
      />
    </div>
  )
}
