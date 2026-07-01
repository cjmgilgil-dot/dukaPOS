import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateReturnReceiptHTML } from "@/lib/receipt/template"
import { generateQRDataURL } from "@/lib/etims/qr"

const REASON_LABELS: Record<string, string> = {
  DEFECTIVE: "Defective",
  WRONG_ITEM: "Wrong Item",
  CUSTOMER_CHANGED_MIND: "Customer Changed Mind",
  DAMAGED: "Damaged",
  WARRANTY: "Warranty",
  OTHER: "Other",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const session = await auth()
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

  const { returnId } = await params

  const ret = await db.return.findUnique({
    where: { id: returnId },
    include: {
      branch: true,
      cashier: { select: { name: true } },
      approver: { select: { name: true } },
      customer: { select: { name: true } },
      originalSale: { select: { saleNumber: true } },
      items: {
        include: {
          productVariant: {
            include: { product: { select: { name: true } } },
          },
        },
      },
    },
  })

  if (!ret) return new NextResponse("Return not found", { status: 404 })

  let etimsQRCodeDataURL: string | undefined
  if (ret.etimsQRCode) {
    etimsQRCodeDataURL = await generateQRDataURL(ret.etimsQRCode).catch(() => undefined)
  }

  const html = generateReturnReceiptHTML(
    {
      returnNumber: ret.returnNumber,
      originalSaleNumber: ret.originalSale.saleNumber,
      returnDate: ret.createdAt,
      cashierName: ret.cashier.name,
      approverName: ret.approver?.name ?? "Manager",
      customerName: ret.customer?.name ?? undefined,
      reason: REASON_LABELS[ret.reason] ?? ret.reason,
      reasonNote: ret.reasonNote ?? undefined,
      items: ret.items.map(ri => ({
        name: ri.productVariant.product.name,
        variantName: ri.productVariant.name,
        quantity: Number(ri.quantity),
        unitPrice: Number(ri.unitPrice),
        lineTotal: Number(ri.lineTotal),
        condition: ri.condition ?? undefined,
      })),
      subtotal: Number(ret.subtotal),
      taxTotal: Number(ret.taxTotal),
      total: Number(ret.total),
      refundMethodLabel:
        ret.refundMethod === "CASH" ? "Cash" :
        ret.refundMethod === "ORIGINAL_PAYMENT" ? "Original Payment Method" :
        "Store Credit",
      etimsCreditNoteNo: ret.etimsCreditNoteNo ?? undefined,
      etimsQRCodeDataURL,
      shopName: ret.branch.name,
      shopAddress: ret.branch.address ?? undefined,
      shopPhone: ret.branch.phone ?? undefined,
      shopKraPIN: ret.branch.kraPIN ?? undefined,
    },
    "80mm"
  )

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
