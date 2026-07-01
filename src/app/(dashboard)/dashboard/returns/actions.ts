"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

type Ok<T = void> = { success: true; data: T }
type Err = { success: false; error: string }
type Result<T = void> = Ok<T> | Err

export interface ReturnRow {
  id: string
  returnNumber: string
  originalSaleNumber: string
  createdAt: Date
  cashierName: string
  customerName: string | null
  itemCount: number
  total: number
  refundMethod: string
  reason: string
  status: string
}

export interface ReturnDetailData {
  id: string
  returnNumber: string
  originalSaleId: string
  originalSaleNumber: string
  createdAt: Date
  cashierName: string
  approverName: string | null
  customerName: string | null
  reason: string
  reasonNote: string | null
  total: number
  taxTotal: number
  subtotal: number
  refundMethod: string
  refundReference: string | null
  etimsCreditNoteNo: string | null
  status: string
  items: {
    id: string
    productName: string
    variantName: string
    unit: string
    quantity: number
    unitPrice: number
    lineTotal: number
    condition: string | null
    serialNumber: string | null
  }[]
}

export async function getReturns(filters?: {
  from?: Date
  to?: Date
  reason?: string
  refundMethod?: string
  search?: string
}): Promise<Result<ReturnRow[]>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  const where: Record<string, unknown> = { branchId }
  if (filters?.from || filters?.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    }
  }
  if (filters?.reason) where.reason = filters.reason
  if (filters?.refundMethod) where.refundMethod = filters.refundMethod
  if (filters?.search) {
    where.OR = [
      { returnNumber: { contains: filters.search, mode: "insensitive" } },
      { originalSale: { saleNumber: { contains: filters.search, mode: "insensitive" } } },
      { customer: { name: { contains: filters.search, mode: "insensitive" } } },
    ]
  }

  const returns = await db.return.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      cashier: { select: { name: true } },
      customer: { select: { name: true } },
      originalSale: { select: { saleNumber: true } },
      items: { select: { id: true } },
    },
    take: 100,
  })

  return {
    success: true,
    data: returns.map(r => ({
      id: r.id,
      returnNumber: r.returnNumber,
      originalSaleNumber: r.originalSale.saleNumber,
      createdAt: r.createdAt,
      cashierName: r.cashier.name,
      customerName: r.customer?.name ?? null,
      itemCount: r.items.length,
      total: Number(r.total),
      refundMethod: r.refundMethod,
      reason: r.reason,
      status: r.status,
    })),
  }
}

export async function getReturnDetail(returnId: string): Promise<Result<ReturnDetailData>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const ret = await db.return.findUnique({
    where: { id: returnId },
    include: {
      cashier: { select: { name: true } },
      approver: { select: { name: true } },
      customer: { select: { name: true } },
      originalSale: { select: { id: true, saleNumber: true } },
      items: {
        include: {
          productVariant: {
            include: { product: { select: { name: true } } },
          },
        },
      },
    },
  })

  if (!ret) return { success: false, error: "Return not found" }

  return {
    success: true,
    data: {
      id: ret.id,
      returnNumber: ret.returnNumber,
      originalSaleId: ret.originalSale.id,
      originalSaleNumber: ret.originalSale.saleNumber,
      createdAt: ret.createdAt,
      cashierName: ret.cashier.name,
      approverName: ret.approver?.name ?? null,
      customerName: ret.customer?.name ?? null,
      reason: ret.reason,
      reasonNote: ret.reasonNote,
      total: Number(ret.total),
      taxTotal: Number(ret.taxTotal),
      subtotal: Number(ret.subtotal),
      refundMethod: ret.refundMethod,
      refundReference: ret.refundReference,
      etimsCreditNoteNo: ret.etimsCreditNoteNo,
      status: ret.status,
      items: ret.items.map(ri => ({
        id: ri.id,
        productName: ri.productVariant.product.name,
        variantName: ri.productVariant.name,
        unit: ri.productVariant.unit,
        quantity: Number(ri.quantity),
        unitPrice: Number(ri.unitPrice),
        lineTotal: Number(ri.lineTotal),
        condition: ri.condition,
        serialNumber: ri.serialNumber,
      })),
    },
  }
}
