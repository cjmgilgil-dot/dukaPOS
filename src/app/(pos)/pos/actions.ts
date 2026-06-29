"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { paystackRequest, generateReference, toKobo } from "@/lib/paystack"
import bcrypt from "bcryptjs"
import type { Prisma } from "@/lib/generated/prisma"
import type { CartItem, CartCustomer } from "@/contexts/CartContext"

type Ok<T = void> = { success: true; data: T }
type Err = { success: false; error: string }
type Result<T = void> = Ok<T> | Err

// ── Helpers ───────────────────────────────────────────────────────────────────

async function buildSaleNumber(
  tx: Prisma.TransactionClient,
  branchId: string
): Promise<string> {
  const branches = await tx.branch.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
  const idx = branches.findIndex(b => b.id === branchId) + 1
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const count = await tx.sale.count({ where: { branchId, createdAt: { gte: start, lt: end } } })
  return `BR${String(idx).padStart(3, "0")}-${dateStr}-${String(count + 1).padStart(4, "0")}`
}

// ── Manager PIN ───────────────────────────────────────────────────────────────

export async function verifyManagerPin(
  pin: string
): Promise<Result<{ managerId: string; managerName: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  const managers = await db.user.findMany({
    where: { branchId, role: { in: ["OWNER", "MANAGER"] }, isActive: true, pinHash: { not: null } },
    select: { id: true, name: true, pinHash: true },
  })

  for (const m of managers) {
    if (!m.pinHash) continue
    if (await bcrypt.compare(pin, m.pinHash)) {
      return { success: true, data: { managerId: m.id, managerName: m.name } }
    }
  }
  return { success: false, error: "Invalid PIN" }
}

// ── Customer ──────────────────────────────────────────────────────────────────

export async function searchCustomers(query: string): Promise<Result<any[]>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const customers = await db.customer.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
      ],
    },
    orderBy: { name: "asc" },
    take: 10,
    select: { id: true, name: true, phone: true, email: true, type: true },
  })
  return { success: true, data: customers }
}

export async function createCustomer(
  name: string,
  phone: string
): Promise<Result<{ id: string; name: string; phone: string | null; email: string | null }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    const customer = await db.customer.create({
      data: { name: name.trim(), phone: phone.trim() || null, isActive: true },
      select: { id: true, name: true, phone: true, email: true },
    })
    return { success: true, data: customer }
  } catch (err: any) {
    if (err?.code === "P2002") return { success: false, error: "Phone number already in use" }
    return { success: false, error: "Failed to create customer" }
  }
}

// ── Hold / Resume ─────────────────────────────────────────────────────────────

interface HoldInput {
  items: { productVariantId: string; qty: number; unitPrice: number; lineDiscountAmount: number }[]
  cartDiscountAmount: number
  customerId?: string
  note?: string
}

export async function holdSale(input: HoldInput): Promise<Result<{ holdId: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { id: userId, branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  try {
    const lineSubtotal = input.items.reduce(
      (s, i) => s + (i.unitPrice * i.qty - i.lineDiscountAmount), 0
    )
    const adjustedSubtotal = Math.max(0, lineSubtotal - input.cartDiscountAmount)

    const held = await db.sale.create({
      data: {
        branchId,
        userId,
        customerId: input.customerId ?? null,
        saleNumber: `HLD-${Date.now()}`,
        subtotal: lineSubtotal,
        taxTotal: adjustedSubtotal * 16 / 116,
        total: adjustedSubtotal,
        discount: input.cartDiscountAmount,
        holdNote: input.note ?? null,
        status: "HELD",
        items: {
          create: input.items.map(i => ({
            productVariantId: i.productVariantId,
            quantity: i.qty,
            unitPrice: i.unitPrice,
            discount: i.lineDiscountAmount,
            lineTax: (i.unitPrice * i.qty - i.lineDiscountAmount) * 16 / 116,
            lineTotal: i.unitPrice * i.qty - i.lineDiscountAmount,
          })),
        },
      },
    })
    return { success: true, data: { holdId: held.id } }
  } catch {
    return { success: false, error: "Failed to hold sale" }
  }
}

export async function getHeldSales(): Promise<Result<any[]>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { branchId } = session.user

  const sales = await db.sale.findMany({
    where: { branchId: branchId || undefined, status: "HELD" },
    include: {
      customer: { select: { name: true } },
      items: { select: { quantity: true, lineTotal: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return { success: true, data: sales }
}

export async function resumeHeldSale(
  holdId: string
): Promise<Result<{ items: CartItem[]; customer: CartCustomer | null }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { branchId } = session.user

  const sale = await db.sale.findUnique({
    where: { id: holdId, status: "HELD" },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      items: {
        include: {
          productVariant: {
            include: {
              product: { select: { id: true, name: true, taxRate: true } },
            },
          },
        },
      },
    },
  })
  if (!sale) return { success: false, error: "Held sale not found" }

  const cartItems: CartItem[] = sale.items.map(si => ({
    productId: si.productVariant.product.id,
    variantId: si.productVariantId,
    name: si.productVariant.product.name,
    variantName: si.productVariant.name,
    unit: si.productVariant.unit,
    price: Number(si.unitPrice),
    originalPrice: Number(si.unitPrice),
    cost: Number(si.productVariant.cost),
    qty: Number(si.quantity),
    lineDiscountType: "fixed" as const,
    lineDiscountValue: Number(si.discount),
    priceOverridden: false,
    taxRate: Number(si.productVariant.product.taxRate),
  }))

  await db.sale.delete({ where: { id: holdId } })

  return {
    success: true,
    data: {
      items: cartItems,
      customer: sale.customer
        ? { id: sale.customer.id, name: sale.customer.name, phone: sale.customer.phone, email: sale.customer.email }
        : null,
    },
  }
}

export async function discardHeldSale(holdId: string): Promise<Result> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  try {
    await db.sale.delete({ where: { id: holdId, status: "HELD" } })
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Failed to discard held sale" }
  }
}

// ── Complete Sale ─────────────────────────────────────────────────────────────

export interface SaleItemInput {
  productVariantId: string
  qty: number
  unitPrice: number
  lineDiscountAmount: number
  taxRate: number
}

export interface PaymentInput {
  method: "CASH" | "MPESA" | "CARD" | "BANK_TRANSFER"
  amount: number
  reference?: string
  paystackReference?: string
  paystackChannel?: string
  mpesaPhoneNumber?: string
}

export interface PriceOverrideInput {
  variantId: string
  originalPrice: number
  newPrice: number
  approvedBy: string
}

export interface CompleteSaleInput {
  items: SaleItemInput[]
  payments: PaymentInput[]
  customerId?: string
  cartDiscountAmount: number
  discountReason?: string
  holdId?: string
  priceOverrides: PriceOverrideInput[]
}

export interface CompletedSale {
  id: string
  saleNumber: string
  total: number
  changeAmount: number
}

export async function completeSale(
  input: CompleteSaleInput
): Promise<Result<CompletedSale>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { id: userId, branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  if (input.items.length === 0) return { success: false, error: "Cart is empty" }

  try {
    const result = await db.$transaction(async (tx) => {
      const saleNumber = await buildSaleNumber(tx, branchId)

      // Totals — prices are VAT-inclusive
      const processedItems = input.items.map(item => {
        const gross = item.unitPrice * item.qty
        const lineTotal = Math.max(0, gross - item.lineDiscountAmount)
        const lineTax = lineTotal * item.taxRate / (100 + item.taxRate)
        return { ...item, lineTotal, lineTax }
      })

      const lineSubtotal = processedItems.reduce((s, i) => s + i.lineTotal, 0)
      const adjustedSubtotal = Math.max(0, lineSubtotal - input.cartDiscountAmount)
      const taxTotal = adjustedSubtotal * 16 / 116

      // Create sale
      const sale = await tx.sale.create({
        data: {
          branchId,
          userId,
          customerId: input.customerId ?? null,
          saleNumber,
          subtotal: lineSubtotal,
          taxTotal,
          total: adjustedSubtotal,
          discount: input.cartDiscountAmount,
          discountReason: input.discountReason ?? null,
          status: "COMPLETED",
        },
      })

      // Create sale items
      for (const item of processedItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productVariantId: item.productVariantId,
            quantity: item.qty,
            unitPrice: item.unitPrice,
            discount: item.lineDiscountAmount,
            lineTax: item.lineTax,
            lineTotal: item.lineTotal,
          },
        })
      }

      // Create payments
      for (const pmt of input.payments) {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            method: pmt.method,
            amount: pmt.amount,
            reference: pmt.reference ?? null,
            paystackReference: pmt.paystackReference ?? null,
            paystackChannel: pmt.paystackChannel ?? null,
            mpesaPhoneNumber: pmt.mpesaPhoneNumber ?? null,
            status: "COMPLETED",
          },
        })
      }

      // Decrement stock + create movements
      for (const item of processedItems) {
        await tx.productStock.update({
          where: { productVariantId_branchId: { productVariantId: item.productVariantId, branchId } },
          data: { quantity: { decrement: item.qty } },
        })
        await tx.stockMovement.create({
          data: {
            productVariantId: item.productVariantId,
            branchId,
            type: "SALE",
            quantity: -item.qty,
            reference: saleNumber,
            userId,
          },
        })
      }

      // Audit log price overrides
      for (const ov of input.priceOverrides) {
        await tx.auditLog.create({
          data: {
            userId: ov.approvedBy,
            branchId,
            action: "PRICE_OVERRIDE",
            entity: "Sale",
            entityId: sale.id,
            details: {
              variantId: ov.variantId,
              originalPrice: ov.originalPrice,
              newPrice: ov.newPrice,
              saleNumber,
            },
          },
        })
      }

      // Remove held sale if resuming
      if (input.holdId) {
        await tx.sale.deleteMany({ where: { id: input.holdId, status: "HELD" } })
      }

      const totalPaid = input.payments.reduce((s, p) => s + p.amount, 0)
      const changeAmount = Math.max(0, totalPaid - adjustedSubtotal)

      return { saleId: sale.id, saleNumber, total: adjustedSubtotal, changeAmount }
    })

    revalidatePath("/dashboard/sales")
    revalidatePath("/dashboard")
    return {
      success: true,
      data: {
        id: result.saleId,
        saleNumber: result.saleNumber,
        total: result.total,
        changeAmount: result.changeAmount,
      },
    }
  } catch (err) {
    console.error("[completeSale]", err)
    return { success: false, error: "Failed to complete sale" }
  }
}

// ── Paystack payments (called from API routes but also usable as actions) ────

export async function initiateMpesaCharge(
  phone: string,
  amountKes: number,
  email: string,
  metadata: Record<string, unknown>
) {
  const reference = generateReference()
  // Normalise Kenyan phone number
  const normalised = phone.replace(/^0/, "+254").replace(/\s/g, "")
  const result = await paystackRequest("/charge", {
    method: "POST",
    body: {
      email,
      amount: toKobo(amountKes),
      currency: "KES",
      reference,
      mobile_money: { phone: normalised, provider: "mpesa" },
      metadata,
    },
  })
  return { reference, result }
}

export async function checkPaystackCharge(reference: string) {
  const result = await paystackRequest(`/charge/${reference}`)
  return {
    status: result.data?.status as string | undefined,
    channel: result.data?.channel as string | undefined,
    amount: result.data?.amount as number | undefined,
  }
}

export async function initiateCardPayment(
  amountKes: number,
  email: string,
  metadata: Record<string, unknown>
) {
  const reference = generateReference()
  return { reference, amountKobo: toKobo(amountKes), email, metadata }
}

export async function verifyCardPayment(reference: string) {
  const result = await paystackRequest(`/transaction/verify/${reference}`)
  if (result.data?.status === "success") {
    return {
      success: true,
      reference,
      channel: result.data.channel as string,
      amount: fromKobo(result.data.amount as number),
    }
  }
  return { success: false, error: result.message ?? "Verification failed" }
}

function fromKobo(k: number) { return k / 100 }

export async function initiateBankTransfer(
  amountKes: number,
  email: string,
  metadata: Record<string, unknown>
) {
  const result = await paystackRequest("/charge", {
    method: "POST",
    body: {
      email,
      amount: toKobo(amountKes),
      currency: "KES",
      bank_transfer: {
        account_expires_at: new Date(Date.now() + 3600_000).toISOString(),
      },
      metadata,
    },
  })
  const reference = result.data?.reference as string | undefined
  const acct = result.data?.bank_transfer as any
  return {
    reference,
    bankName: acct?.bank_name ?? "Unknown Bank",
    accountNumber: acct?.account_number ?? "",
    accountName: acct?.account_name ?? "",
    amount: amountKes,
    status: result.data?.status as string | undefined,
  }
}
