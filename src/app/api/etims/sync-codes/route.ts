import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { syncCodeList, syncItemClassification } from "@/lib/etims/code-sync"

export async function POST() {
  const session = await auth()
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [codes, items] = await Promise.all([syncCodeList(), syncItemClassification()])
  return NextResponse.json({ codes, items })
}
