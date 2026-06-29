"use client"

import { createContext, useContext, useState, useCallback, useMemo } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  variantId: string
  name: string
  variantName: string
  unit: string
  price: number          // current selling price (may be overridden)
  originalPrice: number  // original variant price
  cost: number
  qty: number            // decimal supported
  lineDiscountType: "percent" | "fixed"
  lineDiscountValue: number
  lineDiscountApprovedBy?: string
  priceOverridden: boolean
  priceOverrideApprovedBy?: string
  taxRate: number
}

export interface CartDiscount {
  type: "percent" | "fixed"
  value: number
  approvedBy?: string
}

export interface CartCustomer {
  id: string
  name: string
  phone: string | null
  email: string | null
}

export interface CartTotals {
  lineSubtotal: number       // sum of line totals (after line discounts)
  cartDiscountAmount: number
  adjustedSubtotal: number   // = total paid (VAT-inclusive)
  vatAmount: number          // extracted VAT for display
  total: number              // = adjustedSubtotal
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function computeLineDiscountAmount(item: CartItem): number {
  const gross = item.price * item.qty
  if (item.lineDiscountType === "percent") {
    return Math.min(gross, gross * item.lineDiscountValue / 100)
  }
  return Math.min(item.lineDiscountValue, gross)
}

export function computeLineTotal(item: CartItem): number {
  return Math.max(0, item.price * item.qty - computeLineDiscountAmount(item))
}

function computeTotals(items: CartItem[], cd: CartDiscount): CartTotals {
  const lineSubtotal = items.reduce((s, i) => s + computeLineTotal(i), 0)
  let cartDiscountAmount = 0
  if (cd.value > 0) {
    cartDiscountAmount = cd.type === "percent"
      ? Math.min(lineSubtotal, lineSubtotal * cd.value / 100)
      : Math.min(cd.value, lineSubtotal)
  }
  const adjustedSubtotal = Math.max(0, lineSubtotal - cartDiscountAmount)
  // Prices are VAT-inclusive — extract VAT for reporting
  const vatAmount = adjustedSubtotal * 16 / 116
  return { lineSubtotal, cartDiscountAmount, adjustedSubtotal, vatAmount, total: adjustedSubtotal }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AddItemArgs {
  productId: string
  variantId: string
  name: string
  variantName: string
  unit: string
  price: number
  cost: number
  taxRate: number
}

interface CartContextValue {
  items: CartItem[]
  cartDiscount: CartDiscount
  customer: CartCustomer | null
  totals: CartTotals
  addItem(args: AddItemArgs): void
  removeItem(variantId: string): void
  setQty(variantId: string, qty: number): void
  setLineDiscount(variantId: string, type: "percent" | "fixed", value: number, approvedBy?: string): void
  overridePrice(variantId: string, newPrice: number, approvedBy: string): void
  setCartDiscount(type: "percent" | "fixed", value: number, approvedBy?: string): void
  clearCartDiscount(): void
  setCustomer(customer: CartCustomer | null): void
  clearCart(): void
  loadItems(items: CartItem[], customer?: CartCustomer | null): void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [cartDiscount, setCartDiscountState] = useState<CartDiscount>({ type: "percent", value: 0 })
  const [customer, setCustomer] = useState<CartCustomer | null>(null)

  const totals = useMemo(() => computeTotals(items, cartDiscount), [items, cartDiscount])

  const addItem = useCallback((args: AddItemArgs) => {
    setItems(prev => {
      const existing = prev.find(i => i.variantId === args.variantId)
      if (existing) {
        return prev.map(i => i.variantId === args.variantId ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, {
        ...args,
        originalPrice: args.price,
        qty: 1,
        lineDiscountType: "percent",
        lineDiscountValue: 0,
        priceOverridden: false,
      }]
    })
  }, [])

  const removeItem = useCallback((variantId: string) => {
    setItems(prev => prev.filter(i => i.variantId !== variantId))
  }, [])

  const setQty = useCallback((variantId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.variantId !== variantId))
    } else {
      setItems(prev => prev.map(i => i.variantId === variantId ? { ...i, qty } : i))
    }
  }, [])

  const setLineDiscount = useCallback((
    variantId: string, type: "percent" | "fixed", value: number, approvedBy?: string
  ) => {
    setItems(prev => prev.map(i =>
      i.variantId === variantId
        ? { ...i, lineDiscountType: type, lineDiscountValue: value, lineDiscountApprovedBy: approvedBy }
        : i
    ))
  }, [])

  const overridePrice = useCallback((variantId: string, newPrice: number, approvedBy: string) => {
    setItems(prev => prev.map(i =>
      i.variantId === variantId
        ? { ...i, price: newPrice, priceOverridden: true, priceOverrideApprovedBy: approvedBy }
        : i
    ))
  }, [])

  const setCartDiscount = useCallback((type: "percent" | "fixed", value: number, approvedBy?: string) => {
    setCartDiscountState({ type, value, approvedBy })
  }, [])

  const clearCartDiscount = useCallback(() => {
    setCartDiscountState({ type: "percent", value: 0 })
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setCartDiscountState({ type: "percent", value: 0 })
    setCustomer(null)
  }, [])

  const loadItems = useCallback((newItems: CartItem[], newCustomer?: CartCustomer | null) => {
    setItems(newItems)
    setCartDiscountState({ type: "percent", value: 0 })
    if (newCustomer !== undefined) setCustomer(newCustomer ?? null)
  }, [])

  return (
    <CartContext.Provider value={{
      items, cartDiscount, customer, totals,
      addItem, removeItem, setQty, setLineDiscount, overridePrice,
      setCartDiscount, clearCartDiscount, setCustomer, clearCart, loadItems,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
