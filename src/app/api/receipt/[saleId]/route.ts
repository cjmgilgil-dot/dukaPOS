import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { buildReceiptData } from "@/lib/receipt/builder"
import { generateReceiptHTML } from "@/lib/receipt/template"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { saleId } = await params

  try {
    const data = await buildReceiptData(saleId)
    const html = generateReceiptHTML(data, "80mm")
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (err) {
    console.error("[receipt] Failed to build receipt:", err)
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
