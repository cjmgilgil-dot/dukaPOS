import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateZReport } from "@/app/(dashboard)/dashboard/shifts/actions"
import { generateZReportHTML } from "@/lib/receipt/template"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { shiftId } = await params
  const result = await generateZReport(shiftId)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 })

  const html = generateZReportHTML(result.data, "80mm")
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}
