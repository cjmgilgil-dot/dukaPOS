import { db } from "@/lib/db"
import type { ShiftSummary } from "./types"
export { shiftDuration } from "./utils"

export async function computeShiftSummary(
  shiftId: string,
  openingFloat: number
): Promise<ShiftSummary> {
  const sales = await db.sale.findMany({
    where: { shiftId },
    include: { payments: true },
  })

  const completed = sales.filter(s => s.status === "COMPLETED")
  const voided = sales.filter(s => s.status === "VOIDED")

  const sumMethod = (list: typeof completed, method: string) =>
    list
      .flatMap(s => s.payments)
      .filter(p => p.method === method)
      .reduce((acc, p) => acc + Number(p.amount), 0)

  const completedTotal = completed.reduce((s, x) => s + Number(x.total), 0)
  const voidedTotal = voided.reduce((s, x) => s + Number(x.total), 0)
  const cashSales = sumMethod(completed, "CASH")
  const cashRefunds = sumMethod(voided, "CASH")
  const discounted = completed.filter(s => Number(s.discount) > 0)

  return {
    salesCount: sales.length,
    salesTotal: completedTotal + voidedTotal,
    completedCount: completed.length,
    completedTotal,
    voidedCount: voided.length,
    voidedTotal,
    cashSales,
    mpesaTotal: sumMethod(completed, "MPESA"),
    cardTotal: sumMethod(completed, "CARD"),
    bankTransferTotal: sumMethod(completed, "BANK_TRANSFER"),
    creditTotal: sumMethod(completed, "CREDIT"),
    cashRefunds,
    expectedCash: openingFloat + cashSales - cashRefunds,
    totalVAT: completed.reduce((s, x) => s + Number(x.taxTotal), 0),
    totalDiscounts: discounted.reduce((s, x) => s + Number(x.discount), 0),
    discountCount: discounted.length,
  }
}
