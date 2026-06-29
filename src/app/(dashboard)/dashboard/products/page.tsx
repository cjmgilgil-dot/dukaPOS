import Link from "next/link"
import { Plus, Upload } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { ProductTable } from "@/components/dashboard/products/ProductTable"
import { ProductFilters } from "@/components/dashboard/products/ProductFilters"
import { Suspense } from "react"

interface SearchParams {
  q?: string
  cat?: string
  status?: string
  page?: string
}

const PAGE_SIZE = 30

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const session = await auth()
  const branchId = session?.user?.branchId ?? ""

  const q = params.q?.trim() ?? ""
  const catId = params.cat ?? ""
  const status = params.status ?? ""
  const page = parseInt(params.page ?? "1", 10)

  const where = {
    isDeleted: false,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { sku: { contains: q, mode: "insensitive" as const } },
        { barcode: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(catId && { categoryId: catId }),
    ...(status === "active" && { isActive: true }),
    ...(status === "inactive" && { isActive: false }),
  }

  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          include: { stocks: { where: { branchId: branchId || undefined } } },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Products</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {total} product{total !== 1 ? "s" : ""} in catalog
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/products/import"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--color-surface-alt)] px-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Link>
          <Link
            href="/dashboard/products/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        </div>
      </div>

      <Suspense>
        <ProductFilters categories={categories} />
      </Suspense>

      <ProductTable products={products as any} branchId={branchId} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/products?${new URLSearchParams({ ...params, page: String(p) })}`}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                p === page
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
