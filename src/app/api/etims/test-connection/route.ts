import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { testConnection } from "@/lib/etims/code-sync"

export async function POST() {
  const session = await auth()
  if (!session?.user || !["OWNER", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await testConnection()
  return NextResponse.json(result)
}
