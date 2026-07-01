"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { paystackRequest, toKobo } from "@/lib/paystack"
import { etimsService } from "@/lib/etims"
import { generateQRDataURL } from "@/lib/etims/qr"
import { validateReturn } from "@/lib/returns/policy"
import type { Prisma, ReturnReason, RefundMethod } from "@/lib/generated/prisma"

type Ok<T = void> = { success: true; data: T }
type Err = { success: false; error: string }
type Result<T = void> = Ok<T> | Err

export interface SaleItemForReturn {
  id: string
  productVariantId: string
  productName: string
  variantName: string
  unit: string
  quantity: number
  unitPrice: number
  lineTax: number
  lineTotal: number
  serialNumber: string | null
  previouslyReturned: number
  availableQty: number
}

export interface SaleForReturn {
  id: string
  saleNumber: string
  status: string
  createdAt: Date
  customerId: string | null
  customer: { id: string; name: string; phone: string | null; email: string | null; creditBalance: number } | null
  payments: { method: string; amount: number; paystackReference: string | null }[]
  items: SaleItemForReturn[]
  hasPaystackPayment: boolean
  originalInvoiceNumber: string | null
}

// ── Search sales (POS sale lookup) ────────────────────────────────────────────

export async function searchSalesForReturn(query: string): Promise<Result<{
  id: string
  saleNumber: string
  createdAt: Date
  status: string
  total: number
  itemCount: number
  customerName: string | null
  paymentMethods: string[]
}[]>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const q = query.trim()

  const sales = await db.sale.findMany({
    where: {
      branchId,
      status: "COMPLETED",
      createdAt: { gte: ninetyDaysAgo },
      ...(q ? {
        OR: [
          { saleNumber: { contains: q, mode: "insensitive" } },
          { customer: { phone: { contains: q } } },
          { payments: { some: { reference: { contains: q } } } },
          { payments: { some: { paystackReference: { contains: q } } } },
        ],
      } : {}),
    },
    include: {
      customer: { select: { name: true } },
      payments: { select: { method: true } },
      items: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return {
    success: true,
    data: sales.map(s => ({
      id: s.id,
      saleNumber: s.saleNumber,
      createdAt: s.createdAt,
      status: s.status,
      total: Number(s.total),
      itemCount: s.items.length,
      customerName: s.customer?.name ?? null,
      paymentMethods: [...new Set(s.payments.map(p => p.method))],
    })),
  }
}

// ── Full sale detail for return item selection ────────────────────────────────

export async function getSaleForReturn(saleId: string): Promise<Result<SaleForReturn>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  const sale = await db.sale.findUnique({
    where: { id: saleId, branchId },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true, creditBalance: true } },
      payments: { select: { method: true, amount: true, paystackReference: true } },
      items: {
        include: {
          productVariant: {
            include: { product: { select: { name: true } } },
          },
          returnItems: { select: { quantity: true } },
        },
      },
    },
  })

  if (!sale) return { success: false, error: "Sale not found" }

  const items: SaleItemForReturn[] = sale.items.map(si => {
    const previouslyReturned = si.returnItems.reduce((s, ri) => s + Number(ri.quantity), 0)
    const originalQty = Number(si.quantity)
    return {
      id: si.id,
      productVariantId: si.productVariantId,
      productName: si.productVariant.product.name,
      variantName: si.productVariant.name,
      unit: si.productVariant.unit,
      quantity: originalQty,
      unitPrice: Number(si.unitPrice),
      lineTax: Number(si.lineTax),
      lineTotal: Number(si.lineTotal),
      serialNumber: si.serialNumber,
      previouslyReturned,
      availableQty: Math.max(0, originalQty - previouslyReturned),
    }
  })

  const paystackPayment = sale.payments.find(p => p.paystackReference && p.method !== "CASH")

  return {
    success: true,
    data: {
      id: sale.id,
      saleNumber: sale.saleNumber,
      status: sale.status,
      createdAt: sale.createdAt,
      customerId: sale.customerId,
      customer: sale.customer
        ? {
            id: sale.customer.id,
            name: sale.customer.name,
            phone: sale.customer.phone,
            email: sale.customer.email,
            creditBalance: Number(sale.customer.creditBalance),
          }
        : null,
      payments: sale.payments.map(p => ({
        method: p.method,
        amount: Number(p.amount),
        paystackReference: p.paystackReference,
      })),
      items,
      hasPaystackPayment: !!paystackPayment,
      originalInvoiceNumber: sale.etimsInvoiceNumber,
    },
  }
}

// ── Build return number ───────────────────────────────────────────────────────

async function buildReturnNumber(tx: Prisma.TransactionClient, branchId: string): Promise<string> {
  const branches = await tx.branch.findMany({ orderBy: { createdAt: "asc" }, select: { id: true } })
  const idx = branches.findIndex(b => b.id === branchId) + 1
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const count = await tx.return.count({ where: { branchId, createdAt: { gte: start, lt: end } } })
  return `RET-BR${String(idx).padStart(3, "0")}-${dateStr}-${String(count + 1).padStart(4, "0")}`
}

// ── Process return ────────────────────────────────────────────────────────────

export interface ProcessReturnInput {
  originalSaleId: string
  items: {
    saleItemId: string
    productVariantId: string
    quantity: number
    unitPrice: number
    condition: string
    serialNumber?: string
  }[]
  reason: ReturnReason
  reasonNote?: string
  refundMethod: RefundMethod
  approvedBy: string
  overrideExpired?: boolean
}

export async function processReturn(data: ProcessReturnInput): Promise<Result<{
  id: string
  returnNumber: string
  total: number
  refundMethod: string
  etimsCreditNoteNo?: string
  customerId: string | null
  customerName: string | null
}>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { id: userId, branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  if (data.items.length === 0) return { success: false, error: "No items selected" }

  // Load original sale
  const originalSale = await db.sale.findUnique({
    where: { id: data.originalSaleId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          returnItems: { select: { quantity: true } },
          productVariant: {
            include: {
              product: { select: { name: true, sku: true, kraHSCode: true, taxRate: true } },
            },
          },
        },
      },
      payments: { select: { method: true, amount: true, paystackReference: true } },
      branch: { select: { id: true, name: true, kraPIN: true, etimsDeviceId: true } },
    },
  })
  if (!originalSale) return { success: false, error: "Original sale not found" }

  // Policy validation
  const policy = validateReturn(
    { createdAt: originalSale.createdAt, status: originalSale.status },
    data.overrideExpired
  )
  if (!policy.valid) return { success: false, error: policy.errors[0] }

  // Validate manager
  const manager = await db.user.findUnique({
    where: { id: data.approvedBy },
    select: { id: true, name: true, role: true, branchId: true },
  })
  if (!manager || !["OWNER", "MANAGER"].includes(manager.role) || manager.branchId !== branchId) {
    return { success: false, error: "Invalid manager approval" }
  }

  // Validate quantities
  for (const retItem of data.items) {
    const saleItem = originalSale.items.find(si => si.id === retItem.saleItemId)
    if (!saleItem) return { success: false, error: `Sale item not found: ${retItem.saleItemId}` }
    const alreadyReturned = saleItem.returnItems.reduce((s, ri) => s + Number(ri.quantity), 0)
    const available = Number(saleItem.quantity) - alreadyReturned
    if (retItem.quantity > available) {
      return { success: false, error: `Cannot return ${retItem.quantity} of ${saleItem.productVariant.product.name} — only ${available} available` }
    }
  }

  // Calculate totals
  const TAX_RATE = 16
  const processedItems = data.items.map(item => {
    const lineTotal = item.quantity * item.unitPrice
    const lineTax = lineTotal * TAX_RATE / (100 + TAX_RATE)
    return { ...item, lineTotal, lineTax }
  })
  const total = processedItems.reduce((s, i) => s + i.lineTotal, 0)
  const taxTotal = processedItems.reduce((s, i) => s + i.lineTax, 0)
  const subtotal = total

  try {
    const ret = await db.$transaction(async (tx) => {
      const returnNumber = await buildReturnNumber(tx, branchId)

      // Find active shift
      const openShift = await tx.shift.findFirst({
        where: { userId, branchId, status: "OPEN" },
        select: { id: true },
      })

      // Create Return
      const created = await tx.return.create({
        data: {
          returnNumber,
          branchId,
          userId,
          originalSaleId: data.originalSaleId,
          customerId: originalSale.customerId,
          reason: data.reason,
          reasonNote: data.reasonNote ?? null,
          subtotal,
          taxTotal,
          total,
          refundMethod: data.refundMethod,
          approvedBy: data.approvedBy,
          shiftId: openShift?.id ?? null,
          status: "COMPLETED",
        },
      })

      // Create ReturnItems
      for (const item of processedItems) {
        await tx.returnItem.create({
          data: {
            returnId: created.id,
            originalSaleItemId: item.saleItemId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTax: item.lineTax,
            lineTotal: item.lineTotal,
            serialNumber: item.serialNumber ?? null,
            condition: item.condition,
          },
        })
      }

      // Restore stock (all conditions — defective/damaged still counted in inventory)
      for (const item of processedItems) {
        const saleItem = originalSale.items.find(si => si.id === item.saleItemId)!
        const conditionNote = item.condition !== "Resaleable" ? ` [${item.condition}]` : ""
        try {
          await tx.productStock.update({
            where: { productVariantId_branchId: { productVariantId: item.productVariantId, branchId } },
            data: { quantity: { increment: item.quantity } },
          })
        } catch {
          // Stock record might not exist for this branch; skip update
        }
        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            branchId,
            type: "RETURN",
            quantity: item.quantity,
            reference: returnNumber,
            notes: `Return from ${originalSale.saleNumber}${conditionNote}`,
            userId,
          },
        })
      }

      // Handle store credit
      if (data.refundMethod === "STORE_CREDIT" && originalSale.customerId) {
        await tx.customer.update({
          where: { id: originalSale.customerId },
          data: { creditBalance: { increment: total } },
        })
      }

      // Check if fully returned
      const allReturnItems = await tx.returnItem.groupBy({
        by: ["originalSaleItemId"],
        where: { return: { originalSaleId: data.originalSaleId, status: "COMPLETED" } },
        _sum: { quantity: true },
      })
      const returnedMap = new Map(allReturnItems.map(r => [r.originalSaleItemId, Number(r._sum.quantity ?? 0)]))
      const fullyReturned = originalSale.items.every(si => {
        const returned = returnedMap.get(si.id) ?? 0
        return returned >= Number(si.quantity)
      })
      if (fullyReturned) {
        await tx.sale.update({
          where: { id: data.originalSaleId },
          data: { status: "RETURNED" },
        })
      }

      // AuditLog
      await tx.auditLog.create({
        data: {
          userId,
          branchId,
          action: "RETURN_PROCESSED",
          entity: "Return",
          entityId: created.id,
          details: {
            returnNumber,
            originalSaleId: data.originalSaleId,
            total,
            refundMethod: data.refundMethod,
            approvedBy: manager.name,
            itemCount: processedItems.length,
          },
        },
      })

      return created
    }, { maxWait: 10000, timeout: 30000 })

    // Paystack refund (outside transaction)
    let refundReference: string | undefined
    if (data.refundMethod === "ORIGINAL_PAYMENT") {
      const paystackPayment = originalSale.payments.find(p => p.paystackReference && p.method !== "CASH")
      if (paystackPayment?.paystackReference) {
        try {
          const refundResult = await paystackRequest("/refund", {
            method: "POST",
            body: {
              transaction: paystackPayment.paystackReference,
              amount: toKobo(total),
            },
          })
          refundReference = refundResult.data?.id ? String(refundResult.data.id) : undefined
          if (refundReference) {
            await db.return.update({
              where: { id: ret.id },
              data: { refundReference },
            })
          }
        } catch (err) {
          console.error("[processReturn] Paystack refund error (non-blocking):", err)
        }
      }
    }

    // eTIMS credit note (non-blocking)
    let etimsCreditNoteNo: string | undefined
    try {
      if (originalSale.branch && originalSale.etimsInvoiceNumber) {
        const saleForEtims = {
          id: ret.id,
          saleNumber: ret.returnNumber,
          total: -total,
          taxTotal: -taxTotal,
          subtotal: -subtotal,
          discount: 0,
          createdAt: ret.createdAt,
          customerId: originalSale.customerId,
          customer: originalSale.customer ? { name: originalSale.customer.name, kraPIN: undefined } : null,
          items: processedItems.map((item, idx) => {
            const si = originalSale.items.find(s => s.id === item.saleItemId)!
            return {
              id: `${ret.id}-${idx}`,
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: 0,
              lineTax: item.lineTax,
              lineTotal: item.lineTotal,
              productVariant: {
                name: si.productVariant.name,
                unit: si.productVariant.unit,
                product: {
                  name: si.productVariant.product.name,
                  sku: si.productVariant.product.sku,
                  kraHSCode: si.productVariant.product.kraHSCode,
                  taxRate: Number(si.productVariant.product.taxRate),
                },
              },
            }
          }),
          payments: [],
        }

        const creditResult = await etimsService.submitCreditNote(
          saleForEtims,
          data.reason,
          originalSale.branch,
          originalSale.etimsInvoiceNumber
        )

        if (creditResult.success && creditResult.cuInvoiceNumber) {
          etimsCreditNoteNo = creditResult.cuInvoiceNumber
          const qrUrl = creditResult.qrCodeData
            ? await generateQRDataURL(creditResult.qrCodeData).catch(() => undefined)
            : undefined
          await db.return.update({
            where: { id: ret.id },
            data: {
              etimsCreditNoteNo,
              etimsQRCode: qrUrl ?? null,
            },
          })
        }
      }
    } catch (err) {
      console.error("[processReturn] eTIMS credit note error (non-blocking):", err)
    }

    revalidatePath("/dashboard/returns")
    revalidatePath("/dashboard/sales")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: {
        id: ret.id,
        returnNumber: ret.returnNumber,
        total,
        refundMethod: data.refundMethod,
        etimsCreditNoteNo,
        customerId: originalSale.customerId,
        customerName: originalSale.customer?.name ?? null,
      },
    }
  } catch (err) {
    console.error("[processReturn]", err)
    return { success: false, error: "Failed to process return" }
  }
}
