import { db } from "@/lib/db"
import { OSCUClient } from "./oscu-client"
import { formatKraDate } from "./mappers"

function getOscuClient(): OSCUClient | null {
  const username = process.env.ETIMS_USERNAME
  const password = process.env.ETIMS_PASSWORD
  if (!username || !password) return null

  const env = process.env.ETIMS_ENVIRONMENT ?? "sandbox"
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

export async function syncCodeList(): Promise<{ success: boolean; error?: string }> {
  const client = getOscuClient()
  if (!client) return { success: false, error: "eTIMS not configured" }

  try {
    const existing = await db.etimsCodeCache.findUnique({ where: { codeType: "CODE_LIST" } })
    const lastSyncAt = existing?.lastSyncAt
    const lastReqDt = lastSyncAt ? formatKraDate(lastSyncAt) : "20200101"

    const data = await client.getCodeList(lastReqDt)

    await db.etimsCodeCache.upsert({
      where: { codeType: "CODE_LIST" },
      create: { codeType: "CODE_LIST", data, lastSyncAt: new Date() },
      update: { data, lastSyncAt: new Date() },
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Sync failed" }
  }
}

export async function syncItemClassification(): Promise<{ success: boolean; error?: string }> {
  const client = getOscuClient()
  if (!client) return { success: false, error: "eTIMS not configured" }

  try {
    const existing = await db.etimsCodeCache.findUnique({ where: { codeType: "ITEM_CLASSIFICATION" } })
    const lastSyncAt = existing?.lastSyncAt
    const lastReqDt = lastSyncAt ? formatKraDate(lastSyncAt) : "20200101"

    const data = await client.getItemClassification(lastReqDt)

    await db.etimsCodeCache.upsert({
      where: { codeType: "ITEM_CLASSIFICATION" },
      create: { codeType: "ITEM_CLASSIFICATION", data, lastSyncAt: new Date() },
      update: { data, lastSyncAt: new Date() },
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Sync failed" }
  }
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  const client = getOscuClient()
  if (!client) return { success: false, message: "eTIMS credentials not configured" }

  try {
    const result = await client.initializeDevice()
    if (result.resultCd === "000" || result.resultCd === "00") {
      return { success: true, message: "Connected to KRA eTIMS successfully" }
    }
    return { success: false, message: result.resultMsg ?? `Error code ${result.resultCd}` }
  } catch (err: any) {
    return { success: false, message: err?.message ?? "Connection failed" }
  }
}
