import { NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/paystack"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-paystack-signature") ?? ""

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === "charge.success") {
    const reference = event.data?.reference as string | undefined
    if (reference) {
      // Mark payment as confirmed if it exists as pending
      await db.payment.updateMany({
        where: { paystackReference: reference, status: "PENDING" },
        data: { status: "COMPLETED" },
      })
    }
  }

  return NextResponse.json({ received: true })
}

// Disable body parsing — we need raw body for HMAC verification
export const config = { api: { bodyParser: false } }
