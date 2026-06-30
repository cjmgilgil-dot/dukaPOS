"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { paystackRequest } from "@/lib/paystack"
import { etimsService } from "@/lib/etims"
import { queueForEtims } from "@/lib/etims/queue"
import type { SaleForEtims } from "@/lib/etims/types"

type Ok<T = void> = { success: true; data: T }
type Err = { success: false; error: string }
type Result<T = void> = Ok<T> | Err

export async function voidSale(
  saleId: string,
  reason: string,
  managerId: string
): Promise<Result> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  try {
    await db.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId, branchId, status: "COMPLETED" },
        include: {
          items: true,
          payments: true,
        },
      })
      if (!sale) throw new Error("Sale not found or already voided")

      // Reverse stock
      for (const item of sale.items) {
        await tx.productStock.update({
          where: { productVariantId_branchId: { productVariantId: item.productVariantId, branchId } },
          data: { quantity: { increment: item.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            branchId,
            type: "RETURN",
            quantity: Number(item.quantity),
            reference: sale.saleNumber,
            userId: session.user.id,
          },
        })
      }

      // Attempt Paystack refunds for non-cash payments
      for (const pmt of sale.payments) {
        if (pmt.paystackReference && pmt.method !== "CASH") {
          try {
            await paystackRequest("/refund", {
              method: "POST",
              body: { transaction: pmt.paystackReference },
            })
          } catch { /* best-effort */ }
        }
      }

      await tx.sale.update({
        where: { id: saleId },
        data: { status: "VOIDED", voidReason: reason, voidedBy: managerId },
      })

      await tx.auditLog.create({
        data: {
          userId: managerId,
          branchId,
          action: "VOID_SALE",
          entity: "Sale",
          entityId: saleId,
          details: { saleNumber: sale.saleNumber, reason },
        },
      })
    })

    // eTIMS credit note — non-blocking
    try {
      const saleWithEtims = await db.sale.findUnique({
        where: { id: saleId },
        include: {
          items: { include: { productVariant: { include: { product: true } } } },
          payments: true,
          customer: true,
          branch: true,
        },
      })

      if (saleWithEtims?.etimsInvoiceNumber) {
        const saleForEtims: SaleForEtims = {
          id: saleWithEtims.id,
          saleNumber: saleWithEtims.saleNumber,
          total: Number(saleWithEtims.total),
          taxTotal: Number(saleWithEtims.taxTotal),
          subtotal: Number(saleWithEtims.subtotal),
          discount: Number(saleWithEtims.discount),
          createdAt: saleWithEtims.createdAt,
          customerId: saleWithEtims.customerId,
          customer: saleWithEtims.customer ? { name: saleWithEtims.customer.name } : null,
          items: saleWithEtims.items.map(i => ({
            id: i.id,
            productVariantId: i.productVariantId,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            discount: Number(i.discount),
            lineTax: Number(i.lineTax),
            lineTotal: Number(i.lineTotal),
            productVariant: {
              name: i.productVariant.name,
              unit: i.productVariant.unit,
              product: {
                name: i.productVariant.product.name,
                sku: i.productVariant.product.sku,
                kraHSCode: i.productVariant.product.kraHSCode,
                taxRate: Number(i.productVariant.product.taxRate),
              },
            },
          })),
          payments: saleWithEtims.payments.map(p => ({ method: p.method, amount: Number(p.amount) })),
        }

        const branch = {
          id: saleWithEtims.branch.id,
          name: saleWithEtims.branch.name,
          kraPIN: saleWithEtims.branch.kraPIN,
          etimsDeviceId: saleWithEtims.branch.etimsDeviceId,
        }

        const cnResult = await etimsService.submitCreditNote(
          saleForEtims, reason, branch, saleWithEtims.etimsInvoiceNumber
        )

        if (!cnResult.success) {
          await queueForEtims(saleId, branchId, "CREDIT_NOTE", {
            originalInvoiceNumber: saleWithEtims.etimsInvoiceNumber,
            reason,
          }, cnResult.error)
        }
      } else if (saleWithEtims) {
        // Original sale wasn't submitted — remove from queue if pending
        await db.etimsQueue.deleteMany({ where: { saleId, status: { in: ["PENDING", "RETRYING"] } } })
      }
    } catch (err) {
      console.error("[voidSale] eTIMS credit note error (non-blocking):", err)
    }

    revalidatePath("/dashboard/sales")
    return { success: true, data: undefined }
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to void sale" }
  }
}
