import type { SaleForEtims, BranchForEtims, EtimsInvoiceResult, EtimsStatus, EtimsServiceInterface } from "./types"
import { buildSalesPayload, formatKraDate } from "./mappers"

interface OSCUConfig {
  baseUrl: string
  username: string
  password: string
  tin: string
  branchId: string
  deviceSerial: string
}

export class OSCUClient implements EtimsServiceInterface {
  private config: OSCUConfig
  private token: string | null = null
  private tokenExpiry: Date | null = null
  private lastSuccessAt: Date | null = null

  constructor(config: OSCUConfig) {
    this.config = config
  }

  private async authenticate(): Promise<void> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) return

    const res = await fetch(`${this.config.baseUrl}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tin: this.config.tin,
        bhfId: this.config.branchId,
        dvcSrlNo: this.config.deviceSerial,
        userId: this.config.username,
        password: this.config.password,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    const data = await res.json()
    if (!data.data?.tokenVal) throw new Error(data.resultMsg ?? "Authentication failed")

    this.token = data.data.tokenVal
    this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000) // 55 min
  }

  private async request(endpoint: string, body: Record<string, unknown>): Promise<any> {
    await this.authenticate()
    const res = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cmcKey: this.token!,
      },
      body: JSON.stringify({
        tin: this.config.tin,
        bhfId: this.config.branchId,
        dvcSrlNo: this.config.deviceSerial,
        ...body,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    return res.json()
  }

  async initializeDevice(): Promise<any> {
    return this.request("/api/initialization/osdc-info", {
      reqDt: formatKraDate(new Date()),
    })
  }

  async getCodeList(lastReqDt: string): Promise<any> {
    return this.request("/api/basic-data/code-list", { lastReqDt })
  }

  async getItemClassification(lastReqDt: string): Promise<any> {
    return this.request("/api/basic-data/item-classification", { lastReqDt })
  }

  async submitInvoice(sale: SaleForEtims, branch: BranchForEtims): Promise<EtimsInvoiceResult> {
    try {
      const payload = buildSalesPayload(sale, branch, "NS")
      const res = await this.request("/api/trnsSales/saveSales", { salesList: [payload] })

      if (res.resultCd === "000" || res.resultCd === "00") {
        const d = res.data?.salesList?.[0] ?? {}
        const cuInvoiceNumber = d.cuInvcNo ?? d.rcptNo ?? `KRA-${sale.saleNumber}`
        const qrCodeData = [
          cuInvoiceNumber,
          branch.kraPIN ?? this.config.tin,
          payload.salesDt,
          payload.totAmt.toFixed(2),
          payload.totTaxAmt.toFixed(2),
        ].join("|")
        this.lastSuccessAt = new Date()
        return { success: true, cuInvoiceNumber, internalData: d.intrlData, receiptSignature: d.rcptSign, qrCodeData }
      }

      return { success: false, error: res.resultMsg ?? `KRA error ${res.resultCd}` }
    } catch (err: any) {
      return { success: false, error: err?.message ?? "Network error" }
    }
  }

  async submitCreditNote(
    sale: SaleForEtims,
    _reason: string,
    branch: BranchForEtims,
    originalInvoiceNumber: string
  ): Promise<EtimsInvoiceResult> {
    try {
      const payload = buildSalesPayload(sale, branch, "NC", originalInvoiceNumber)
      const res = await this.request("/api/trnsSales/saveSales", { salesList: [payload] })

      if (res.resultCd === "000" || res.resultCd === "00") {
        const d = res.data?.salesList?.[0] ?? {}
        const cuInvoiceNumber = d.cuInvcNo ?? `KRA-CN-${sale.saleNumber}`
        this.lastSuccessAt = new Date()
        return { success: true, cuInvoiceNumber, qrCodeData: cuInvoiceNumber }
      }

      return { success: false, error: res.resultMsg ?? `KRA error ${res.resultCd}` }
    } catch (err: any) {
      return { success: false, error: err?.message ?? "Network error" }
    }
  }

  getStatus(): EtimsStatus {
    return {
      isConnected: this.token !== null && (this.tokenExpiry?.getTime() ?? 0) > Date.now(),
      lastSuccessfulSubmission: this.lastSuccessAt,
      queueDepth: 0,
      failedCount: 0,
    }
  }
}
