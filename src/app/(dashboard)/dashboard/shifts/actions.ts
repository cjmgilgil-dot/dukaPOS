"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { computeShiftSummary, shiftDuration } from "@/lib/shift/summary"
import type { ZReport } from "@/lib/shift/types"
import bcrypt from "bcryptjs"

type Ok<T = void> = { success: true; data: T }
type Err = { success: false; error: string }
type Result<T = void> = Ok<T> | Err

export interface ShiftRow {
  id: string
  cashierName: string
  openedAt: Date
  closedAt: Date | null
  duration: string
  status: string
  salesCount: number
  expectedCash: number | null
  closingCash: number | null
  variance: number | null
}

export async function getShifts(filters?: {
  status?: "OPEN" | "CLOSED"
  from?: Date
  to?: Date
}): Promise<Result<ShiftRow[]>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  const where: Record<string, unknown> = { branchId }
  if (filters?.status) where.status = filters.status
  if (filters?.from || filters?.to) {
    where.openedAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    }
  }

  const shifts = await db.shift.findMany({
    where,
    orderBy: { openedAt: "desc" },
    include: {
      user: { select: { name: true } },
      _count: { select: { sales: { where: { status: "COMPLETED" } } } },
    },
  })

  const rows: ShiftRow[] = shifts.map(s => ({
    id: s.id,
    cashierName: s.user.name,
    openedAt: s.openedAt,
    closedAt: s.closedAt,
    duration: shiftDuration(s.openedAt, s.closedAt),
    status: s.status,
    salesCount: s._count.sales,
    expectedCash: s.expectedCash ? Number(s.expectedCash) : null,
    closingCash: s.closingCash ? Number(s.closingCash) : null,
    variance: s.variance ? Number(s.variance) : null,
  }))

  return { success: true, data: rows }
}

export async function getShiftDetail(shiftId: string): Promise<Result<{
  shift: {
    id: string
    cashierName: string
    branchName: string
    openedAt: Date
    closedAt: Date | null
    status: string
    openingFloat: number
    closingCash: number | null
    expectedCash: number | null
    variance: number | null
    varianceNote: string | null
  }
  sales: {
    id: string
    saleNumber: string
    status: string
    total: number
    createdAt: Date
    customer: { name: string } | null
    user: { name: string }
    payments: { method: string; amount: number }[]
    items: { quantity: number }[]
  }[]
}>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      user: { select: { name: true } },
      branch: { select: { name: true } },
      sales: {
        include: {
          customer: { select: { name: true } },
          user: { select: { name: true } },
          payments: { select: { method: true, amount: true } },
          items: { select: { quantity: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!shift) return { success: false, error: "Shift not found" }

  return {
    success: true,
    data: {
      shift: {
        id: shift.id,
        cashierName: shift.user.name,
        branchName: shift.branch.name,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        status: shift.status,
        openingFloat: Number(shift.openingFloat),
        closingCash: shift.closingCash ? Number(shift.closingCash) : null,
        expectedCash: shift.expectedCash ? Number(shift.expectedCash) : null,
        variance: shift.variance ? Number(shift.variance) : null,
        varianceNote: shift.varianceNote,
      },
      sales: shift.sales.map(s => ({
        id: s.id,
        saleNumber: s.saleNumber,
        status: s.status,
        total: Number(s.total),
        createdAt: s.createdAt,
        customer: s.customer,
        user: s.user,
        payments: s.payments.map(p => ({ method: p.method, amount: Number(p.amount) })),
        items: s.items.map(i => ({ quantity: Number(i.quantity) })),
      })),
    },
  }
}

export async function generateZReport(shiftId: string): Promise<Result<ZReport>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const shift = await db.shift.findUnique({
    where: { id: shiftId },
    include: {
      user: { select: { name: true } },
      branch: { select: { name: true } },
    },
  })
  if (!shift) return { success: false, error: "Shift not found" }

  const summary = await computeShiftSummary(shiftId, Number(shift.openingFloat))

  // Top items by revenue
  const saleItems = await db.saleItem.findMany({
    where: { sale: { shiftId, status: "COMPLETED" } },
    include: {
      productVariant: { include: { product: { select: { name: true } } } },
    },
  })

  const itemMap = new Map<string, { productName: string; variantName: string; quantity: number; revenue: number }>()
  for (const item of saleItems) {
    const key = item.productVariantId
    const existing = itemMap.get(key)
    if (existing) {
      existing.quantity += Number(item.quantity)
      existing.revenue += Number(item.lineTotal)
    } else {
      itemMap.set(key, {
        productName: item.productVariant.product.name,
        variantName: item.productVariant.name,
        quantity: Number(item.quantity),
        revenue: Number(item.lineTotal),
      })
    }
  }

  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return {
    success: true,
    data: {
      shiftId,
      isOpen: shift.status === "OPEN",
      branchName: shift.branch.name,
      cashierName: shift.user.name,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt ?? undefined,
      duration: shiftDuration(shift.openedAt, shift.closedAt),
      openingFloat: Number(shift.openingFloat),
      summary,
      countedCash: shift.closingCash ? Number(shift.closingCash) : undefined,
      variance: shift.variance ? Number(shift.variance) : undefined,
      varianceNote: shift.varianceNote ?? undefined,
      topItems,
    },
  }
}

export async function forceCloseShift(input: {
  shiftId: string
  managerPin: string
}): Promise<Result> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }
  const { branchId } = session.user
  if (!branchId) return { success: false, error: "No branch" }

  // Verify manager PIN
  const managers = await db.user.findMany({
    where: { branchId, role: { in: ["OWNER", "MANAGER"] }, isActive: true, pinHash: { not: null } },
    select: { id: true, name: true, pinHash: true },
  })
  let managerId: string | undefined
  let managerName: string | undefined
  for (const m of managers) {
    if (m.pinHash && await bcrypt.compare(input.managerPin, m.pinHash)) {
      managerId = m.id
      managerName = m.name
      break
    }
  }
  if (!managerId) return { success: false, error: "Invalid manager PIN" }

  const shift = await db.shift.findUnique({ where: { id: input.shiftId } })
  if (!shift) return { success: false, error: "Shift not found" }
  if (shift.status !== "OPEN") return { success: false, error: "Shift is already closed" }

  const summary = await computeShiftSummary(input.shiftId, Number(shift.openingFloat))

  await db.shift.update({
    where: { id: input.shiftId },
    data: {
      closingCash: summary.expectedCash,
      expectedCash: summary.expectedCash,
      variance: 0,
      varianceNote: `Force closed by ${managerName}`,
      status: "CLOSED",
      closedAt: new Date(),
    },
  })

  await db.auditLog.create({
    data: {
      userId: managerId,
      branchId,
      action: "SHIFT_FORCE_CLOSED",
      entity: "Shift",
      entityId: input.shiftId,
      details: { expectedCash: summary.expectedCash, forcedBy: managerName },
    },
  })

  revalidatePath("/dashboard/shifts")
  revalidatePath("/dashboard")
  return { success: true, data: undefined }
}
