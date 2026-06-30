import type { SaleForEtims, BranchForEtims, EtimsInvoiceResult, EtimsStatus, EtimsServiceInterface } from "./types"
import { formatKraDate } from "./mappers"

export class MockOSCUClient implements EtimsServiceInterface {
  private lastSuccessAt: Date | null = null

  async submitInvoice(sale: SaleForEtims, branch: BranchForEtims): Promise<EtimsInvoiceResult> {
    await new Promise(r => setTimeout(r, 300))

    // 90% success rate so queue behavior can be observed in dev
    if (Math.random() > 0.1) {
      const cuInvoiceNumber = `MOCK-${Date.now().toString(36).toUpperCase()}`
      const qrCodeData = [
        cuInvoiceNumber,
        branch.kraPIN ?? "P0123456789A",
        formatKraDate(new Date(sale.createdAt)),
        Number(sale.total).toFixed(2),
        Number(sale.taxTotal).toFixed(2),
      ].join("|")
      this.lastSuccessAt = new Date()
      return {
        success: true,
        cuInvoiceNumber,
        internalData: `MOCK_INTERNAL_${sale.saleNumber}`,
        receiptSignature: "MOCK_SIGNATURE",
        qrCodeData,
      }
    }

    return { success: false, error: "Mock: Simulated KRA timeout" }
  }

  async submitCreditNote(
    sale: SaleForEtims,
    _reason: string,
    _branch: BranchForEtims,
    originalInvoiceNumber: string
  ): Promise<EtimsInvoiceResult> {
    await new Promise(r => setTimeout(r, 200))
    const cuInvoiceNumber = `MOCK-CN-${Date.now().toString(36).toUpperCase()}`
    this.lastSuccessAt = new Date()
    return {
      success: true,
      cuInvoiceNumber,
      internalData: `MOCK_CN_${originalInvoiceNumber}`,
      receiptSignature: "MOCK_CN_SIGNATURE",
      qrCodeData: cuInvoiceNumber,
    }
  }

  getStatus(): EtimsStatus {
    return {
      isConnected: true,
      lastSuccessfulSubmission: this.lastSuccessAt,
      queueDepth: 0,
      failedCount: 0,
    }
  }
}
