import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import { ProductForm } from "@/components/dashboard/products/ProductForm"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.branchId) redirect("/dashboard")

  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id, isDeleted: false },
      include: {
        variants: {
          where: { isActive: true },
          include: { stocks: true },
        },
      },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Edit Product</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{product.name}</p>
      </div>
      <ProductForm
        product={product as any}
        categories={categories}
        branchId={session.user.branchId}
      />
    </div>
  )
}
