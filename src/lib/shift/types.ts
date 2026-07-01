export interface ActiveShift {
  id: string
  openedAt: Date
  openingFloat: number
  salesCount: number
  cashTotal: number
}

export interface ShiftSummary {
  salesCount: number
  salesTotal: number
  completedCount: number
  completedTotal: number
  voidedCount: number
  voidedTotal: number
  cashSales: number
  mpesaTotal: number
  cardTotal: number
  bankTransferTotal: number
  creditTotal: number
  cashRefunds: number
  expectedCash: number
  totalVAT: number
  totalDiscounts: number
  discountCount: number
}

export interface ZReportTopItem {
  productName: string
  variantName: string
  quantity: number
  revenue: number
}

export interface ZReport {
  shiftId: string
  isOpen: boolean
  branchName: string
  cashierName: string
  openedAt: Date
  closedAt?: Date
  duration: string
  openingFloat: number
  summary: ShiftSummary
  countedCash?: number
  variance?: number
  varianceNote?: string
  topItems: ZReportTopItem[]
}
