import type { UnitOfMeasure, PaymentMethod } from "@/lib/generated/prisma"

export interface EtimsInvoiceResult {
  success: boolean
  cuInvoiceNumber?: string
  internalData?: string
  receiptSignature?: string
  qrCodeData?: string
  error?: string
}

export interface EtimsStatus {
  isConnected: boolean
  lastSuccessfulSubmission: Date | null
  queueDepth: number
  failedCount: number
}

export interface EtimsServiceInterface {
  submitInvoice(sale: SaleForEtims, branch: BranchForEtims): Promise<EtimsInvoiceResult>
  submitCreditNote(sale: SaleForEtims, reason: string, branch: BranchForEtims, originalInvoiceNumber: string): Promise<EtimsInvoiceResult>
  getStatus(): EtimsStatus
}

export interface SaleItemForEtims {
  id: string
  productVariantId: string
  quantity: number
  unitPrice: number
  discount: number
  lineTax: number
  lineTotal: number
  productVariant: {
    name: string
    unit: UnitOfMeasure
    product: {
      name: string
      sku: string
      kraHSCode: string | null
      taxRate: number
    }
  }
}

export interface PaymentForEtims {
  method: PaymentMethod
  amount: number
}

export interface SaleForEtims {
  id: string
  saleNumber: string
  total: number
  taxTotal: number
  subtotal: number
  discount: number
  createdAt: Date
  customerId: string | null
  customer?: { name: string; kraPIN?: string | null } | null
  items: SaleItemForEtims[]
  payments: PaymentForEtims[]
}

export interface BranchForEtims {
  id: string
  name: string
  kraPIN: string | null
  etimsDeviceId: string | null
}

// KRA payload types
export interface KraSaleItem {
  itemSeq: number
  itemCd: string
  itemClsCd: string
  itemNm: string
  bcd?: string
  qtyUnitCd: string
  qty: number
  unitPrice: number
  splyAmt: number
  dcRt: number
  dcAmt: number
  taxTyCd: string
  taxblAmt: number
  taxAmt: number
  totAmt: number
  prcUnit: number
}

export interface KraSalesPayload {
  invcNo: string
  orgInvcNo?: string
  rcptTyCd: string
  pmtTyCd: string
  salesDt: string
  salesTm: string
  custTin?: string
  custNm?: string
  remark?: string
  totItemCnt: number
  taxblAmtA: number
  taxblAmtB: number
  taxblAmtC: number
  taxblAmtD: number
  taxblAmtE: number
  taxAmtA: number
  taxAmtB: number
  taxAmtC: number
  taxAmtD: number
  taxAmtE: number
  totTaxblAmt: number
  totTaxAmt: number
  totAmt: number
  itemList: KraSaleItem[]
}
