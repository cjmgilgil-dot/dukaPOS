import type { EtimsServiceInterface } from "./types"
import { OSCUClient } from "./oscu-client"
import { MockOSCUClient } from "./mock-client"

export type { EtimsServiceInterface, EtimsInvoiceResult, EtimsStatus, SaleForEtims, BranchForEtims, SaleItemForEtims, PaymentForEtims } from "./types"

function createEtimsService(): EtimsServiceInterface {
  const env = process.env.ETIMS_ENVIRONMENT ?? "sandbox"
  const username = process.env.ETIMS_USERNAME
  const password = process.env.ETIMS_PASSWORD

  if (!username || !password) {
    if (process.env.NODE_ENV !== "test") {
      console.info("[eTIMS] Credentials not configured — running in mock mode")
    }
    return new MockOSCUClient()
  }

  const baseUrl = env === "production"
    ? (process.env.ETIMS_PRODUCTION_URL ?? "https://etims-api.kra.go.ke/etims-api")
    : (process.env.ETIMS_SANDBOX_URL ?? "https://etims-api-sbx.kra.go.ke/etims-api")

  return new OSCUClient({
    baseUrl,
    username,
    password,
    tin: process.env.ETIMS_TIN ?? "",
    branchId: process.env.ETIMS_BRANCH_ID ?? "00",
    deviceSerial: process.env.ETIMS_DEVICE_SERIAL ?? "",
  })
}

// Module-level singleton — one connection per server process
export const etimsService: EtimsServiceInterface = createEtimsService()
