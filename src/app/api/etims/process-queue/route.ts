import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { processEtimsQueue } from "@/lib/etims/queue"

export async function POST(req: NextRequest) {
  // Allow both session auth (dashboard) and bearer token auth (cron job)
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET
  const isCronRequest = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCronRequest) {
    const session = await auth()
    if (!session?.user || !["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const result = await processEtimsQueue()
  return NextResponse.json(result)
}
