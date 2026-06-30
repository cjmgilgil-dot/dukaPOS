import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const [queueDepth, failedCount, lastSent] = await Promise.all([
    db.etimsQueue.count({ where: { status: { in: ["PENDING", "RETRYING"] } } }),
    db.etimsQueue.count({ where: { status: "FAILED" } }),
    db.etimsQueue.findFirst({
      where: { status: "SENT" },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    }),
  ])

  return NextResponse.json({
    queueDepth,
    failedCount,
    lastSuccessAt: lastSent?.sentAt ?? null,
  })
}
