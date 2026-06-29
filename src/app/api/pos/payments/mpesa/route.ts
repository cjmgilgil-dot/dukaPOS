import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { initiateMpesaCharge } from "@/app/(pos)/pos/actions"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { phone, amount, email, metadata } = await req.json()
  if (!phone || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const result = await initiateMpesaCharge(phone, amount, email, metadata ?? {})
  return NextResponse.json(result)
}
