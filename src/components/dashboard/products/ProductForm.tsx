"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import { VariantEditor } from "./VariantEditor"
import { createProduct, updateProduct } from "@/app/(dashboard)/dashboard/products/actions"
import type { VariantInput, ProductFormInput } from "@/app/(dashboard)/dashboard/products/actions"
import type { Category, Product, ProductVariant, ProductStock } from "@/lib/generated/prisma"

interface ProductWithRelations extends Product {
  variants: (ProductVariant & {
    stocks: ProductStock[]
  })[]
}

interface ProductFormProps {
  product?: ProductWithRelations | null
  categories: Category[]
  branchId: string
}

export function ProductForm({ product, categories, branchId }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [sku, setSku] = useState(product?.sku ?? "")
  const [barcode, setBarcode] = useState(product?.barcode ?? "")
  const [name, setName] = useState(product?.name ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "")
  const [taxRate, setTaxRate] = useState(Number(product?.taxRate ?? 16))

  const [variants, setVariants] = useState<VariantInput[]>(() => {
    if (!product) return [{ name: "Per Piece", unit: "PIECE" as any, conversionFactor: 1, price: 0, cost: 0, isDefault: true, stock: 0, reorderLevel: 0 }]
    return product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      unit: v.unit,
      conversionFactor: Number(v.conversionFactor),
      price: Number(v.price),
      cost: Number(v.cost),
      isDefault: v.isDefault,
      stock: Number(v.stocks.find((s) => s.branchId === branchId)?.quantity ?? 0),
      reorderLevel: Number(v.stocks.find((s) => s.branchId === branchId)?.reorderLevel ?? 0),
    }))
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (variants.length === 0) {
      toast.error("Add at least one variant")
      return
    }
    if (!variants.some((v) => v.isDefault)) {
      toast.error("Mark one variant as default")
      return
    }

    const input: ProductFormInput = {
      sku, barcode: barcode || undefined, name, description: description || undefined,
      categoryId: categoryId || undefined, taxRate, variants,
    }

    setSaving(true)
    try {
      const res = product
        ? await updateProduct(product.id, input)
        : await createProduct(input)

      if (res.success) {
        toast.success(product ? "Product updated" : "Product created")
        router.push("/dashboard/products")
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: main details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--color-text)]">Product Details</h3>

            <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. 2.5mm² Twin & Earth Cable" />

            <div className="grid grid-cols-2 gap-4">
              <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="e.g. EL-TC-2.5" />
              <Input label="Barcode (optional)" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="EAN / UPC" />
            </div>

            <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description…" />
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--color-text)]">Variants &amp; Pricing</h3>
            <VariantEditor
              variants={variants}
              onChange={setVariants}
              stockReadonly={!!product}
            />
          </div>
        </div>

        {/* Right: classification */}
        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--color-text)]">Classification</h3>

            <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— No category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
              ))}
            </Select>

            <Input
              label="Tax Rate (%)"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  )
}
