"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { paystackRequest } from "@/lib/paystack"

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

    revalidatePath("/dashboard/sales")
    return { success: true, data: undefined }
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to void sale" }
  }
}
