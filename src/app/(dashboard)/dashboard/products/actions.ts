"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { UnitOfMeasure } from "@/lib/generated/prisma"

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ── helpers ──────────────────────────────────────────────────────────────────

function requireManager(role: string) {
  return ["OWNER", "MANAGER"].includes(role)
}

// ── product CRUD ──────────────────────────────────────────────────────────────

export interface VariantInput {
  id?: string
  name: string
  unit: UnitOfMeasure
  conversionFactor: number
  price: number
  cost: number
  isDefault: boolean
  stock: number
  reorderLevel: number
}

export interface ProductFormInput {
  sku: string
  name: string
  description?: string
  categoryId?: string
  taxRate: number
  barcode?: string
  variants: VariantInput[]
}

export async function createProduct(
  input: ProductFormInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const branchId = session.user.branchId
  if (!branchId) return { success: false, error: "No branch assigned" }

  try {
    const product = await db.product.create({
      data: {
        sku: input.sku.trim(),
        barcode: input.barcode?.trim() || null,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        categoryId: input.categoryId || null,
        taxRate: input.taxRate,
        isActive: true,
        isDeleted: false,
        variants: {
          create: input.variants.map((v) => ({
            name: v.name,
            unit: v.unit,
            conversionFactor: v.conversionFactor,
            price: v.price,
            cost: v.cost,
            isDefault: v.isDefault,
            isActive: true,
            stocks: {
              create: {
                branchId,
                quantity: v.stock,
                reorderLevel: v.reorderLevel,
              },
            },
          })),
        },
      },
    })

    // create initial stock movements
    const created = await db.product.findUnique({
      where: { id: product.id },
      include: { variants: true },
    })
    if (created) {
      for (const variant of created.variants) {
        const stock = input.variants.find((v) => v.name === variant.name)
        if (stock && stock.stock > 0) {
          await db.stockMovement.create({
            data: {
              productVariantId: variant.id,
              branchId,
              type: "INITIAL",
              quantity: stock.stock,
              notes: "Initial stock",
            },
          })
        }
      }
    }

    revalidatePath("/dashboard/products")
    return { success: true, data: { id: product.id } }
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { success: false, error: "SKU or barcode already exists" }
    }
    return { success: false, error: "Failed to create product" }
  }
}

export async function updateProduct(
  id: string,
  input: ProductFormInput
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const branchId = session.user.branchId
  if (!branchId) return { success: false, error: "No branch assigned" }

  try {
    await db.product.update({
      where: { id },
      data: {
        sku: input.sku.trim(),
        barcode: input.barcode?.trim() || null,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        categoryId: input.categoryId || null,
        taxRate: input.taxRate,
      },
    })

    // upsert variants
    for (const v of input.variants) {
      if (v.id) {
        await db.productVariant.update({
          where: { id: v.id },
          data: {
            name: v.name,
            unit: v.unit,
            conversionFactor: v.conversionFactor,
            price: v.price,
            cost: v.cost,
            isDefault: v.isDefault,
          },
        })
        await db.productStock.upsert({
          where: { productVariantId_branchId: { productVariantId: v.id, branchId } },
          update: { reorderLevel: v.reorderLevel },
          create: {
            productVariantId: v.id,
            branchId,
            quantity: v.stock,
            reorderLevel: v.reorderLevel,
          },
        })
      } else {
        const newVariant = await db.productVariant.create({
          data: {
            productId: id,
            name: v.name,
            unit: v.unit,
            conversionFactor: v.conversionFactor,
            price: v.price,
            cost: v.cost,
            isDefault: v.isDefault,
            isActive: true,
          },
        })
        await db.productStock.create({
          data: {
            productVariantId: newVariant.id,
            branchId,
            quantity: v.stock,
            reorderLevel: v.reorderLevel,
          },
        })
        if (v.stock > 0) {
          await db.stockMovement.create({
            data: {
              productVariantId: newVariant.id,
              branchId,
              type: "INITIAL",
              quantity: v.stock,
              notes: "Initial stock (added on edit)",
            },
          })
        }
      }
    }

    revalidatePath("/dashboard/products")
    revalidatePath(`/dashboard/products/${id}/edit`)
    return { success: true }
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { success: false, error: "SKU or barcode already exists" }
    }
    return { success: false, error: "Failed to update product" }
  }
}

export async function toggleProductActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    await db.product.update({ where: { id }, data: { isActive } })
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update product" }
  }
}

export async function softDeleteProduct(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    await db.product.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete product" }
  }
}

export async function bulkDeleteProducts(ids: string[]): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    await db.product.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted: true, isActive: false },
    })
    revalidatePath("/dashboard/products")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete products" }
  }
}

export async function adjustStock(
  variantId: string,
  branchId: string,
  delta: number,
  notes?: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    await db.productStock.update({
      where: { productVariantId_branchId: { productVariantId: variantId, branchId } },
      data: { quantity: { increment: delta } },
    })
    await db.stockMovement.create({
      data: {
        productVariantId: variantId,
        branchId,
        type: "ADJUSTMENT",
        quantity: delta,
        notes: notes ?? "Manual adjustment",
        userId: session.user.id,
      },
    })
    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard/inventory")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to adjust stock" }
  }
}
