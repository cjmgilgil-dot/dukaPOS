import { db } from "@/lib/db"
import { etimsService } from "./index"
import { buildSalesPayload } from "./mappers"
import type { SaleForEtims, BranchForEtims } from "./types"

export async function queueForEtims(
  saleId: string,
  branchId: string,
  type: "SALES" | "CREDIT_NOTE",
  payload: Record<string, unknown>,
  errorMessage?: string
): Promise<void> {
  await db.etimsQueue.create({
    data: {
      saleId,
      branchId,
      payload: { type, ...payload } as any,
      status: "PENDING",
      attempts: 0,
      lastError: errorMessage ?? null,
    },
  })
}

export async function processEtimsQueue(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const pending = await db.etimsQueue.findMany({
    where: {
      status: { in: ["PENDING", "RETRYING"] },
      attempts: { lt: 10 },
    },
    include: {
      sale: {
        include: {
          items: {
            include: {
              productVariant: {
                include: { product: true },
              },
            },
          },
          payments: true,
          customer: true,
          branch: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  })

  let succeeded = 0
  let failed = 0

  for (const item of pending) {
    try {
      const sale = item.sale as any
      const branch: BranchForEtims = {
        id: sale.branch.id,
        name: sale.branch.name,
        kraPIN: sale.branch.kraPIN,
        etimsDeviceId: sale.branch.etimsDeviceId,
      }

      const saleForEtims: SaleForEtims = {
        id: sale.id,
        saleNumber: sale.saleNumber,
        total: Number(sale.total),
        taxTotal: Number(sale.taxTotal),
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        createdAt: sale.createdAt,
        customerId: sale.customerId,
        customer: sale.customer ? {
          name: sale.customer.name,
          kraPIN: sale.customer.kraPIN,
        } : null,
        items: sale.items.map((i: any) => ({
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
        payments: sale.payments.map((p: any) => ({
          method: p.method,
          amount: Number(p.amount),
        })),
      }

      const queuePayload = item.payload as any
      const isCreditNote = queuePayload?.type === "CREDIT_NOTE"

      const result = isCreditNote
        ? await etimsService.submitCreditNote(saleForEtims, queuePayload.reason ?? "", branch, queuePayload.originalInvoiceNumber ?? "")
        : await etimsService.submitInvoice(saleForEtims, branch)

      if (result.success) {
        await db.etimsQueue.update({
          where: { id: item.id },
          data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 } },
        })
        await db.sale.update({
          where: { id: item.saleId },
          data: {
            etimsInvoiceNumber: result.cuInvoiceNumber ?? null,
            etimsQRCode: result.qrCodeData ?? null,
          },
        })
        succeeded++
      } else {
        const nextAttempts = item.attempts + 1
        await db.etimsQueue.update({
          where: { id: item.id },
          data: {
            status: nextAttempts >= 10 ? "FAILED" : "RETRYING",
            attempts: { increment: 1 },
            lastError: result.error ?? null,
          },
        })
        failed++
      }
    } catch (err: any) {
      const nextAttempts = item.attempts + 1
      await db.etimsQueue.update({
        where: { id: item.id },
        data: {
          status: nextAttempts >= 10 ? "FAILED" : "RETRYING",
          attempts: { increment: 1 },
          lastError: err?.message ?? "Unknown error",
        },
      })
      failed++
    }
  }

  return { processed: pending.length, succeeded, failed }
}
