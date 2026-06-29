import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkPaystackCharge, verifyCardPayment } from "@/app/(pos)/pos/actions"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const reference = req.nextUrl.searchParams.get("reference")
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 })

  // Try charge endpoint first (M-Pesa/bank-transfer), fall back to transaction verify (card)
  const charge = await checkPaystackCharge(reference)
  if (charge.status) {
    return NextResponse.json(charge)
  }

  const verify = await verifyCardPayment(reference)
  return NextResponse.json({ status: verify.success ? "success" : "failed" })
}
