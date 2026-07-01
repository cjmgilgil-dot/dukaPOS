"use client"

import { useState } from "react"
import {
  ShoppingCart, UserCircle, Clock, Tag, Percent, ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react"
import { CartProvider, useCart, computeLineDiscountAmount, computeLineTotal } from "@/contexts/CartContext"
import { ProductGrid } from "./ProductGrid"
import { VariantPickerModal } from "@/app/(pos)/pos/components/VariantPickerModal"
import { QuantityKeypad } from "@/app/(pos)/pos/components/QuantityKeypad"
import { CartLineActions } from "@/app/(pos)/pos/components/CartLineActions"
import { CartDiscountModal } from "@/app/(pos)/pos/components/CartDiscount"
import { CustomerSearchModal } from "@/app/(pos)/pos/components/CustomerSearch"
import { HeldSalesModal } from "@/app/(pos)/pos/components/HeldSales"
import { CheckoutModal } from "@/app/(pos)/pos/components/CheckoutModal"
import { holdSale } from "@/app/(pos)/pos/actions"
import { toast } from "sonner"
import type { Category } from "@/lib/generated/prisma"
import { cn } from "@/lib/utils"

interface POSWorkspaceProps {
  categories: Category[]
  branchId: string
  hasActiveShift?: boolean
}

interface PendingProduct {
  productId: string
  name: string
  variants: {
    id: string
    name: string
    unit: string
    price: number
    cost: number
    taxRate?: number
    stock?: number
  }[]
}

function POSCartPanel() {
  const { items, cartDiscount, customer, totals, setQty, clearCart } = useCart()
  const [expandedLine, setExpandedLine] = useState<string | null>(null)
  const [qtyEditItem, setQtyEditItem] = useState<string | null>(null)
  const [cartDiscountOpen, setCartDiscountOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [holding, setHolding] = useState(false)

  const itemCount = items.reduce((s, i) => s + i.qty, 0)

  async function handleHold() {
    if (items.length === 0) return
    setHolding(true)
    const res = await holdSale({
      items: items.map(i => ({
        productVariantId: i.variantId,
        qty: i.qty,
        unitPrice: i.price,
        lineDiscountAmount: computeLineDiscountAmount(i),
      })),
      cartDiscountAmount: totals.cartDiscountAmount,
      customerId: customer?.id,
    })
    setHolding(false)
    if (res.success) {
      clearCart()
      toast.success("Sale held")
    } else {
      toast.error(res.error)
    }
  }

  return (
    <>
      <div className="flex w-80 flex-col border-l border-[var(--color-surface-alt)] bg-[var(--color-surface)]">
        {/* Cart header */}
        <div className="flex items-center gap-2 border-b border-[var(--color-surface-alt)] px-3 py-2.5">
          <ShoppingCart className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
          <span className="font-semibold text-[var(--color-text)]">Cart</span>
          {itemCount > 0 && (
            <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white">
              {itemCount}
            </span>
          )}
          <div className="ml-auto flex gap-1">
            {/* Customer */}
            <button
              onClick={() => setCustomerOpen(true)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors",
                customer
                  ? "bg-orange-500/10 text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
              )}
              title={customer ? customer.name : "Assign customer"}
            >
              <UserCircle className="h-4 w-4" />
            </button>
            {/* Held sales */}
            <button
              onClick={() => setHeldOpen(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
              title="Held sales"
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Customer pill */}
        {customer && (
          <div className="border-b border-[var(--color-surface-alt)] px-3 py-2">
            <button
              onClick={() => setCustomerOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg bg-orange-500/10 px-2.5 py-1.5 text-left text-xs hover:bg-orange-500/15 transition-colors"
            >
              <UserCircle className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              <span className="font-medium text-[var(--color-text)]">{customer.name}</span>
              {customer.phone && (
                <span className="ml-auto text-[var(--color-text-muted)]">{customer.phone}</span>
              )}
            </button>
          </div>
        )}

        {/* Line items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-[var(--color-text-muted)]">Cart is empty</p>
            </div>
          ) : (
            items.map(item => {
              const lineDiscount = computeLineDiscountAmount(item)
              const lineTotal = computeLineTotal(item)
              const isExpanded = expandedLine === item.variantId

              return (
                <div key={item.variantId}>
                  <div
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-2.5 cursor-pointer"
                    onClick={() => setExpandedLine(isExpanded ? null : item.variantId)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)] leading-tight truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">{item.variantName}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm font-semibold text-[var(--color-text)]">
                          KES {lineTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        {item.priceOverridden && (
                          <p className="text-[10px] text-amber-400">price override</p>
                        )}
                      </div>
                      {isExpanded
                        ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)] mt-0.5" />
                        : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)] mt-0.5" />
                      }
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); setQty(item.variantId, item.qty - 1) }}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-sm"
                      >−</button>
                      <button
                        onClick={e => { e.stopPropagation(); setQtyEditItem(item.variantId) }}
                        className="min-w-[2.5rem] text-center text-sm font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        {item.qty % 1 === 0 ? item.qty : item.qty.toFixed(2)}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setQty(item.variantId, item.qty + 1) }}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors text-sm"
                      >+</button>
                      <span className="text-xs text-[var(--color-text-muted)]">{item.unit}</span>
                      {lineDiscount > 0 && (
                        <span className="ml-auto flex items-center gap-0.5 text-[10px] text-[var(--color-primary)]">
                          <Tag className="h-2.5 w-2.5" />
                          -{lineDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <CartLineActions
                      item={item}
                      onQtyEdit={() => setQtyEditItem(item.variantId)}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Totals + actions */}
        <div className="border-t border-[var(--color-surface-alt)] p-3 space-y-2">
          {/* Cart discount row */}
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setCartDiscountOpen(true)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 transition-colors",
                cartDiscount.value > 0
                  ? "bg-orange-500/10 text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
              )}
            >
              <Percent className="h-3 w-3" />
              {cartDiscount.value > 0
                ? `Discount: ${cartDiscount.type === "percent" ? `${cartDiscount.value}%` : `KES ${cartDiscount.value}`}`
                : "Add discount"}
            </button>
            {totals.cartDiscountAmount > 0 && (
              <span className="font-mono text-[var(--color-primary)]">
                -KES {totals.cartDiscountAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>

          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>VAT 16% (incl.)</span>
            <span className="font-mono">KES {totals.vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>

          <div className="flex justify-between font-bold text-[var(--color-text)]">
            <span>Total</span>
            <span className="font-mono text-[var(--color-primary)] text-lg">
              KES {totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <button
            disabled={items.length === 0}
            onClick={() => setCheckoutOpen(true)}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Checkout — KES {totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleHold}
              disabled={items.length === 0 || holding}
              className="flex-1 rounded-lg border border-[var(--color-border)] py-2 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {holding ? "Holding..." : "Hold Sale"}
            </button>
            <button
              onClick={clearCart}
              disabled={items.length === 0}
              className="flex-1 rounded-lg py-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)] disabled:opacity-40 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuantityKeypad
        isOpen={qtyEditItem !== null}
        label="Enter quantity"
        initialValue={items.find(i => i.variantId === qtyEditItem)?.qty ?? 1}
        onConfirm={val => { if (qtyEditItem) { setQty(qtyEditItem, val); setQtyEditItem(null) } }}
        onClose={() => setQtyEditItem(null)}
      />
      <CartDiscountModal isOpen={cartDiscountOpen} onClose={() => setCartDiscountOpen(false)} />
      <CustomerSearchModal isOpen={customerOpen} onClose={() => setCustomerOpen(false)} />
      <HeldSalesModal isOpen={heldOpen} onClose={() => setHeldOpen(false)} />
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  )
}

function POSWorkspaceInner({ categories, branchId, hasActiveShift = true }: POSWorkspaceProps) {
  const { addItem } = useCart()
  const [pendingProduct, setPendingProduct] = useState<PendingProduct | null>(null)

  function handleProductClick(product: any) {
    const activeVariants = product.variants?.filter((v: any) => v.isActive !== false) ?? []
    if (activeVariants.length === 0) return

    if (activeVariants.length === 1) {
      const v = activeVariants[0]
      addItem({
        productId: product.id,
        variantId: v.id,
        name: product.name,
        variantName: v.name,
        unit: v.unit,
        price: Number(v.price),
        cost: Number(v.cost),
        taxRate: Number(product.taxRate ?? 16),
      })
    } else {
      setPendingProduct({
        productId: product.id,
        name: product.name,
        variants: activeVariants.map((v: any) => ({
          id: v.id,
          name: v.name,
          unit: v.unit,
          price: Number(v.price),
          cost: Number(v.cost),
          stock: v.stocks?.[0]?.quantity ?? undefined,
        })),
      })
    }
  }

  function handleVariantSelect(variant: PendingProduct["variants"][0]) {
    if (!pendingProduct) return
    addItem({
      productId: pendingProduct.productId,
      variantId: variant.id,
      name: pendingProduct.name,
      variantName: variant.name,
      unit: variant.unit,
      price: variant.price,
      cost: variant.cost,
      taxRate: variant.taxRate ?? 16,
    })
    setPendingProduct(null)
  }

  return (
    <div className="flex h-full flex-col">
      {!hasActiveShift && (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          No active shift — cash reconciliation unavailable
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <ProductGrid
            categories={categories}
            branchId={branchId}
            onAddToCart={handleProductClick}
          />
      </div>

        <POSCartPanel />
      </div>

      <VariantPickerModal
        isOpen={pendingProduct !== null}
        productName={pendingProduct?.name ?? ""}
        variants={pendingProduct?.variants ?? []}
        onSelect={handleVariantSelect}
        onClose={() => setPendingProduct(null)}
      />
    </div>
  )
}

export function POSWorkspace({ categories, branchId, hasActiveShift }: POSWorkspaceProps) {
  return (
    <CartProvider>
      <POSWorkspaceInner categories={categories} branchId={branchId} hasActiveShift={hasActiveShift} />
    </CartProvider>
  )
}
