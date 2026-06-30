import type { UnitOfMeasure, PaymentMethod } from "@/lib/generated/prisma"
import type { SaleForEtims, BranchForEtims, KraSalesPayload, KraSaleItem } from "./types"

export function mapPaymentMethod(method: PaymentMethod): string {
  const map: Record<string, string> = {
    CASH: "01",
    CARD: "06",
    BANK_TRANSFER: "04",
    MPESA: "05",
  }
  return map[method] ?? "06"
}

export function mapTaxType(taxRate: number): string {
  if (taxRate === 16) return "A"
  if (taxRate === 0) return "B"
  if (taxRate === 8) return "D"
  return "C"
}

export function mapUnitCode(unit: UnitOfMeasure): string {
  const map: Record<UnitOfMeasure, string> = {
    PIECE: "U",
    METER: "MTR",
    KILOGRAM: "KG",
    GRAM: "GRM",
    LITER: "LTR",
    MILLILITER: "MLT",
    BOX: "BX",
    PACK: "PK",
    ROLL: "RL",
    PAIR: "PR",
    SET: "SET",
    DOZEN: "DZ",
    SQUARE_METER: "M2",
    CUBIC_METER: "M3",
  }
  return map[unit] ?? "U"
}

export function formatKraDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

export function formatKraTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  const s = String(date.getSeconds()).padStart(2, "0")
  return `${h}${min}${s}`
}

export function fmt(n: number): number {
  return Math.round(n * 100) / 100
}

export function buildSalesPayload(
  sale: SaleForEtims,
  branch: BranchForEtims,
  receiptType: "NS" | "NC" | "CS" | "TS" | "PS",
  originalInvoiceNumber?: string
): KraSalesPayload {
  // Primary payment method
  const primaryPayment = sale.payments[0]
  const pmtTyCd = primaryPayment ? mapPaymentMethod(primaryPayment.method) : "01"

  // Accumulate per-tax-type totals (A=16%, B=0%, C=exempt, D=8%, E=n/a)
  const taxBuckets: Record<string, { taxable: number; tax: number }> = {
    A: { taxable: 0, tax: 0 },
    B: { taxable: 0, tax: 0 },
    C: { taxable: 0, tax: 0 },
    D: { taxable: 0, tax: 0 },
    E: { taxable: 0, tax: 0 },
  }

  const itemList: KraSaleItem[] = sale.items.map((item, idx) => {
    const taxRate = item.productVariant.product.taxRate
    const taxTyCd = mapTaxType(taxRate)
    const gross = item.unitPrice * item.quantity
    const dcAmt = fmt(item.discount)
    const dcRt = gross > 0 ? fmt((dcAmt / gross) * 100) : 0
    const splyAmt = fmt(item.lineTotal)
    const taxblAmt = taxRate > 0 ? fmt(splyAmt * 100 / (100 + taxRate)) : splyAmt
    const taxAmt = fmt(splyAmt - taxblAmt)

    taxBuckets[taxTyCd].taxable += taxblAmt
    taxBuckets[taxTyCd].tax += taxAmt

    return {
      itemSeq: idx + 1,
      itemCd: item.productVariant.product.sku,
      itemClsCd: item.productVariant.product.kraHSCode ?? "99999999",
      itemNm: item.productVariant.product.name,
      qtyUnitCd: mapUnitCode(item.productVariant.unit),
      qty: Number(item.quantity),
      unitPrice: fmt(item.unitPrice),
      prcUnit: fmt(item.unitPrice),
      splyAmt,
      dcRt,
      dcAmt,
      taxTyCd,
      taxblAmt,
      taxAmt,
      totAmt: splyAmt,
    }
  })

  const totTaxblAmt = fmt(Object.values(taxBuckets).reduce((s, b) => s + b.taxable, 0))
  const totTaxAmt = fmt(Object.values(taxBuckets).reduce((s, b) => s + b.tax, 0))
  const totAmt = fmt(Number(sale.total))

  const payload: KraSalesPayload = {
    invcNo: sale.saleNumber,
    rcptTyCd: receiptType,
    pmtTyCd,
    salesDt: formatKraDate(new Date(sale.createdAt)),
    salesTm: formatKraTime(new Date(sale.createdAt)),
    totItemCnt: itemList.length,
    taxblAmtA: fmt(taxBuckets.A.taxable),
    taxblAmtB: fmt(taxBuckets.B.taxable),
    taxblAmtC: fmt(taxBuckets.C.taxable),
    taxblAmtD: fmt(taxBuckets.D.taxable),
    taxblAmtE: fmt(taxBuckets.E.taxable),
    taxAmtA: fmt(taxBuckets.A.tax),
    taxAmtB: fmt(taxBuckets.B.tax),
    taxAmtC: fmt(taxBuckets.C.tax),
    taxAmtD: fmt(taxBuckets.D.tax),
    taxAmtE: fmt(taxBuckets.E.tax),
    totTaxblAmt,
    totTaxAmt,
    totAmt,
    itemList,
  }

  if (sale.customer?.name) payload.custNm = sale.customer.name
  if (sale.customer?.kraPIN) payload.custTin = sale.customer.kraPIN
  if (originalInvoiceNumber) payload.orgInvcNo = originalInvoiceNumber

  return payload
}
