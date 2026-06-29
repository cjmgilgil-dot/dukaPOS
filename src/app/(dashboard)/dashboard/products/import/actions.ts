"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { UnitOfMeasure } from "@/lib/generated/prisma"

interface CsvRow {
  sku: string
  name: string
  category?: string
  unit?: string
  price: string
  cost?: string
  stock?: string
  reorderLevel?: string
  taxRate?: string
  barcode?: string
}

type ImportResult = {
  success: true
  created: number
  skipped: number
  errors: string[]
} | { success: false; error: string }

export async function importProductsFromCsv(
  rows: CsvRow[]
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const branchId = session.user.branchId
  if (!branchId) return { success: false, error: "No branch assigned" }

  let created = 0
  let skipped = 0
  const errors: string[] = []

  // preload categories by name
  const cats = await db.category.findMany({ select: { id: true, name: true } })
  const catMap = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    if (!row.sku?.trim() || !row.name?.trim()) {
      errors.push(`Row ${rowNum}: missing sku or name`)
      skipped++
      continue
    }

    const existing = await db.product.findUnique({ where: { sku: row.sku.trim() } })
    if (existing) {
      skipped++
      continue
    }

    const categoryId = row.category ? catMap.get(row.category.toLowerCase()) : undefined
    const unit = (row.unit?.toUpperCase() ?? "PIECE") as UnitOfMeasure
    const price = parseFloat(row.price) || 0
    const cost = parseFloat(row.cost ?? "0") || 0
    const stock = parseFloat(row.stock ?? "0") || 0
    const reorderLevel = parseFloat(row.reorderLevel ?? "0") || 0
    const taxRate = parseFloat(row.taxRate ?? "16") || 16

    try {
      const product = await db.product.create({
        data: {
          sku: row.sku.trim(),
          barcode: row.barcode?.trim() || null,
          name: row.name.trim(),
          categoryId: categoryId ?? null,
          taxRate,
          isActive: true,
          isDeleted: false,
          variants: {
            create: {
              name: "Per " + unit.charAt(0) + unit.slice(1).toLowerCase(),
              unit,
              conversionFactor: 1,
              price,
              cost,
              isDefault: true,
              isActive: true,
              stocks: {
                create: { branchId, quantity: stock, reorderLevel },
              },
            },
          },
        },
        include: { variants: true },
      })

      if (stock > 0) {
        await db.stockMovement.create({
          data: {
            productVariantId: product.variants[0].id,
            branchId,
            type: "INITIAL",
            quantity: stock,
            notes: "Imported via CSV",
          },
        })
      }

      created++
    } catch (err: any) {
      errors.push(`Row ${rowNum}: ${err.message ?? "unknown error"}`)
      skipped++
    }
  }

  revalidatePath("/dashboard/products")
  return { success: true, created, skipped, errors }
}
