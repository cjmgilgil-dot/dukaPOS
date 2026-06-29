import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { initiateBankTransfer } from "@/app/(pos)/pos/actions"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount, email, metadata } = await req.json()
  if (!amount) return NextResponse.json({ error: "Missing amount" }, { status: 400 })

  const result = await initiateBankTransfer(amount, email ?? "pos@dukapos.co.ke", metadata ?? {})
  return NextResponse.json(result)
}
