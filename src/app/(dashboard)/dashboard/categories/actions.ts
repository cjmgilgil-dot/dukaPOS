"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

type ActionResult = { success: true } | { success: false; error: string }

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const name = formData.get("name") as string
  const icon = (formData.get("icon") as string) || null
  const color = (formData.get("color") as string) || null
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10)

  if (!name?.trim()) return { success: false, error: "Name is required" }

  try {
    await db.category.create({
      data: { name: name.trim(), icon, color, sortOrder, isActive: true },
    })
    revalidatePath("/dashboard/categories")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to create category" }
  }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  const name = formData.get("name") as string
  const icon = (formData.get("icon") as string) || null
  const color = (formData.get("color") as string) || null
  const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10)

  if (!name?.trim()) return { success: false, error: "Name is required" }

  try {
    await db.category.update({
      where: { id },
      data: { name: name.trim(), icon, color, sortOrder },
    })
    revalidatePath("/dashboard/categories")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update category" }
  }
}

export async function toggleCategoryActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    await db.category.update({ where: { id }, data: { isActive } })
    revalidatePath("/dashboard/categories")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update category" }
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Unauthorized" }

  try {
    const productCount = await db.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${productCount} product(s) are assigned to this category`,
      }
    }
    await db.category.delete({ where: { id } })
    revalidatePath("/dashboard/categories")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete category" }
  }
}
