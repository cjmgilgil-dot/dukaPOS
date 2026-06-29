"use client"

import { useState } from "react"
import { ShoppingCart } from "lucide-react"
import { ProductGrid } from "./ProductGrid"
import type { Category } from "@/lib/generated/prisma"

interface CartItem {
  productId: string
  variantId: string
  name: string
  variantName: string
  price: number
  qty: number
}

interface POSWorkspaceProps {
  categories: Category[]
  branchId: string
}

export function POSWorkspace({ categories, branchId }: POSWorkspaceProps) {
  const [cart, setCart] = useState<CartItem[]>([])

  function addToCart(product: any, variant: any) {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id)
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          variantName: variant.name,
          price: Number(variant.price),
          qty: 1,
        },
      ]
    })
  }

  function updateQty(variantId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.variantId !== variantId))
    } else {
      setCart((prev) => prev.map((i) => i.variantId === variantId ? { ...i, qty } : i))
    }
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = subtotal * 0.16
  const total = subtotal + tax

  return (
    <div className="flex h-full">
      {/* Product panel */}
      <div className="flex flex-1 flex-col overflow-hidden p-4">
        <ProductGrid
          categories={categories}
          branchId={branchId}
          onAddToCart={addToCart}
        />
      </div>

      {/* Cart panel */}
      <div className="flex w-80 flex-col border-l border-[var(--color-surface-alt)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-surface-alt)] px-4 py-3">
          <ShoppingCart className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="font-semibold text-[var(--color-text)]">Cart</span>
          {cart.length > 0 && (
            <span className="ml-auto rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white">
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-[var(--color-text-muted)]">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.variantId}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3"
              >
                <p className="text-sm font-medium text-[var(--color-text)] leading-tight">
                  {item.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">{item.variantName}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.variantId, item.qty - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-[var(--color-text)]">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.variantId, item.qty + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
                  >
                    +
                  </button>
                  <span className="ml-auto font-mono text-sm font-semibold text-[var(--color-text)]">
                    KES {(item.price * item.qty).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals + checkout */}
        <div className="border-t border-[var(--color-surface-alt)] p-4 space-y-2">
          <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
            <span>Subtotal</span>
            <span className="font-mono">KES {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
            <span>VAT 16%</span>
            <span className="font-mono">KES {tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between font-bold text-[var(--color-text)]">
            <span>Total</span>
            <span className="font-mono text-[var(--color-primary)]">
              KES {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <button
            disabled={cart.length === 0}
            className="mt-2 w-full rounded-lg bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Checkout — KES {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </button>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="w-full rounded-lg py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
            >
              Clear cart
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
