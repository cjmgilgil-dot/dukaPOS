import { db } from "@/lib/db"
import { generateQRDataURL } from "@/lib/etims/qr"

export interface ReceiptItem {
  name: string
  variantName: string
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
  taxRate: number
}

export interface ReceiptPayment {
  method: string
  label: string
  amount: number
  reference?: string
}

export interface ReceiptData {
  saleNumber: string
  saleDate: Date
  // Shop info
  shopName: string
  shopAddress: string
  shopPhone: string
  shopKraPIN: string
  // Cashier
  cashierName: string
  // Customer
  customerName?: string
  customerPhone?: string
  customerKraPIN?: string
  // Items
  items: ReceiptItem[]
  // Totals
  subtotal: number
  discount: number
  taxTotal: number
  total: number
  // Payments
  payments: ReceiptPayment[]
  changeAmount: number
  // eTIMS
  etimsInvoiceNumber?: string
  etimsQRCodeDataURL?: string
  // Settings
  footerText: string
  returnPolicy: string
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  MPESA: "M-Pesa",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT: "Credit",
}

export async function buildReceiptData(saleId: string): Promise<ReceiptData> {
  const sale = await db.sale.findUniqueOrThrow({
    where: { id: saleId },
    include: {
      branch: true,
      user: { select: { name: true } },
      customer: { select: { name: true, phone: true, kraPIN: true } },
      items: {
        include: {
          productVariant: {
            include: { product: { select: { name: true, taxRate: true } } },
          },
        },
      },
      payments: true,
    },
  })

  const items: ReceiptItem[] = sale.items.map((item) => ({
    name: item.productVariant.product.name,
    variantName: item.productVariant.name,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    discount: Number(item.discount),
    lineTotal: Number(item.lineTotal),
    taxRate: Number(item.productVariant.product.taxRate),
  }))

  const payments: ReceiptPayment[] = sale.payments.map((p) => ({
    method: p.method,
    label: PAYMENT_LABELS[p.method] ?? p.method,
    amount: Number(p.amount),
    reference: p.reference ?? p.paystackReference ?? p.mpesaPhoneNumber ?? undefined,
  }))

  const cashPaid = payments
    .filter((p) => p.method === "CASH")
    .reduce((s, p) => s + p.amount, 0)
  const changeAmount = Math.max(0, cashPaid - Number(sale.total))

  let etimsQRCodeDataURL: string | undefined
  if (sale.etimsQRCode) {
    etimsQRCodeDataURL = await generateQRDataURL(sale.etimsQRCode).catch(() => undefined)
  }

  return {
    saleNumber: sale.saleNumber,
    saleDate: sale.createdAt,
    shopName: sale.branch.name,
    shopAddress: sale.branch.address ?? "",
    shopPhone: sale.branch.phone ?? "",
    shopKraPIN: sale.branch.kraPIN ?? "",
    cashierName: sale.user.name,
    customerName: sale.customer?.name,
    customerPhone: sale.customer?.phone ?? undefined,
    customerKraPIN: sale.customer?.kraPIN ?? undefined,
    items,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    taxTotal: Number(sale.taxTotal),
    total: Number(sale.total),
    payments,
    changeAmount,
    etimsInvoiceNumber: sale.etimsInvoiceNumber ?? undefined,
    etimsQRCodeDataURL,
    footerText: "Thank you for shopping with us!",
    returnPolicy: "Goods once sold are not refundable unless accompanied by receipt",
  }
}
