import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/dashboard/products/ProductForm"

export default async function NewProductPage() {
  const session = await auth()
  if (!session?.user?.branchId) redirect("/dashboard")

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)]">New Product</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Add a new product to your catalog.
        </p>
      </div>
      <ProductForm categories={categories} branchId={session.user.branchId} />
    </div>
  )
}
