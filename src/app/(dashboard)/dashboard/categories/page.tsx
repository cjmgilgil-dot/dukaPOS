import { db } from "@/lib/db"
import { CategoriesPageClient } from "@/components/dashboard/categories/CategoriesPageClient"

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  })

  return <CategoriesPageClient categories={categories} />
}
