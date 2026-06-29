"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import type { VariantInput } from "@/app/(dashboard)/dashboard/products/actions"

const UNITS = [
  "PIECE", "METER", "KILOGRAM", "GRAM", "LITER", "MILLILITER",
  "BOX", "PACK", "ROLL", "PAIR", "SET", "DOZEN", "SQUARE_METER", "CUBIC_METER",
]

interface VariantEditorProps {
  variants: VariantInput[]
  onChange: (variants: VariantInput[]) => void
  stockReadonly?: boolean
}

function emptyVariant(): VariantInput {
  return {
    name: "",
    unit: "PIECE" as any,
    conversionFactor: 1,
    price: 0,
    cost: 0,
    isDefault: false,
    stock: 0,
    reorderLevel: 0,
  }
}

export function VariantEditor({ variants, onChange, stockReadonly = false }: VariantEditorProps) {
  function add() {
    const next = [...variants, emptyVariant()]
    if (next.length === 1) next[0].isDefault = true
    onChange(next)
  }

  function remove(i: number) {
    const next = variants.filter((_, idx) => idx !== i)
    if (next.length > 0 && !next.some((v) => v.isDefault)) next[0].isDefault = true
    onChange(next)
  }

  function update<K extends keyof VariantInput>(i: number, key: K, val: VariantInput[K]) {
    const next = variants.map((v, idx) => (idx === i ? { ...v, [key]: val } : v))
    onChange(next)
  }

  function setDefault(i: number) {
    onChange(variants.map((v, idx) => ({ ...v, isDefault: idx === i })))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-text)]">Variants / Units</p>
        <Button type="button" variant="secondary" size="sm" onClick={add}
          className="h-8 px-2 text-xs min-h-0">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Variant
        </Button>
      </div>

      {variants.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Add at least one variant (e.g. Per Piece, Per Roll).
        </p>
      )}

      {variants.map((v, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 space-y-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="defaultVariant"
              checked={v.isDefault}
              onChange={() => setDefault(i)}
              className="accent-[var(--color-primary)]"
              title="Set as default"
            />
            <span className="text-xs text-[var(--color-text-muted)]">Default</span>
            <div className="ml-auto">
              {variants.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(i)}
                  className="h-7 w-7 p-0 min-h-0 min-w-0 hover:text-[var(--color-danger)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Name"
              value={v.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="e.g. Per Meter"
              inputSize="md"
            />
            <Select
              label="Unit"
              value={v.unit}
              onChange={(e) => update(i, "unit", e.target.value as any)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Price (KES)"
              type="number"
              min={0}
              step={0.01}
              value={v.price}
              onChange={(e) => update(i, "price", parseFloat(e.target.value) || 0)}
              inputSize="md"
            />
            <Input
              label="Cost (KES)"
              type="number"
              min={0}
              step={0.01}
              value={v.cost}
              onChange={(e) => update(i, "cost", parseFloat(e.target.value) || 0)}
              inputSize="md"
            />
            <Input
              label="Conv. Factor"
              type="number"
              min={0.001}
              step={0.001}
              value={v.conversionFactor}
              onChange={(e) => update(i, "conversionFactor", parseFloat(e.target.value) || 1)}
              inputSize="md"
              title="Number of base units in this variant"
            />
          </div>

          {!stockReadonly && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Opening Stock"
                type="number"
                min={0}
                value={v.stock}
                onChange={(e) => update(i, "stock", parseFloat(e.target.value) || 0)}
                inputSize="md"
              />
              <Input
                label="Reorder Level"
                type="number"
                min={0}
                value={v.reorderLevel}
                onChange={(e) => update(i, "reorderLevel", parseFloat(e.target.value) || 0)}
                inputSize="md"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
