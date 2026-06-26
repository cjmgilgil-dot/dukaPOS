import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

// VAT is inclusive in Kenya — extract from VAT-inclusive price
// For 16% VAT: tax = price × 16/116
export function calculateVAT(
  inclusivePrice: number,
  taxRate: number = 16
): { netPrice: number; tax: number } {
  const tax = (inclusivePrice * taxRate) / (100 + taxRate)
  const netPrice = inclusivePrice - tax
  return {
    netPrice: Math.round(netPrice * 100) / 100,
    tax: Math.round(tax * 100) / 100,
  }
}

// Format: BR001-20260625-0042
export function generateSaleNumber(
  branchIndex: number,
  sequenceNumber: number
): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const branch = `BR${String(branchIndex).padStart(3, "0")}`
  const seq = String(sequenceNumber).padStart(4, "0")
  return `${branch}-${dateStr}-${seq}`
}
