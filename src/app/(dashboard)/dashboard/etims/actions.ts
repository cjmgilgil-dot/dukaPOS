"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { processEtimsQueue } from "@/lib/etims/queue"
import { syncCodeList, syncItemClassification, testConnection } from "@/lib/etims/code-sync"

type Ok<T = void> = { success: true; data: T }
type Err = { success: false; error: string }
type Result<T = void> = Ok<T> | Err

export async function triggerQueueProcess(): Promise<Result<{ processed: number; succeeded: number; failed: number }>> {
  const session = await auth()
  if (!session?.user || !["OWNER", "MANAGER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }
  const result = await processEtimsQueue()
  revalidatePath("/dashboard/etims")
  return { success: true, data: result }
}

export async function triggerSyncCodes(): Promise<Result<string>> {
  const session = await auth()
  if (!session?.user || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" }
  }
  const [codes, items] = await Promise.all([syncCodeList(), syncItemClassification()])
  revalidatePath("/dashboard/etims")
  if (codes.success && items.success) return { success: true, data: "Codes synced successfully" }
  return { success: false, error: codes.error ?? items.error ?? "Sync failed" }
}

export async function triggerTestConnection(): Promise<Result<string>> {
  const session = await auth()
  if (!session?.user || !["OWNER", "MANAGER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }
  const result = await testConnection()
  return result.success
    ? { success: true, data: result.message }
    : { success: false, error: result.message }
}

export async function retryQueueItem(itemId: string): Promise<Result> {
  const session = await auth()
  if (!session?.user || !["OWNER", "MANAGER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }
  await db.etimsQueue.update({
    where: { id: itemId },
    data: { status: "PENDING", attempts: 0, lastError: null },
  })
  revalidatePath("/dashboard/etims")
  return { success: true, data: undefined }
}

export async function markQueueItemSent(itemId: string): Promise<Result> {
  const session = await auth()
  if (!session?.user || session.user.role !== "OWNER") {
    return { success: false, error: "Unauthorized" }
  }
  await db.etimsQueue.update({
    where: { id: itemId },
    data: { status: "SENT", sentAt: new Date() },
  })
  revalidatePath("/dashboard/etims")
  return { success: true, data: undefined }
}

export async function retryAllFailed(): Promise<Result<number>> {
  const session = await auth()
  if (!session?.user || !["OWNER", "MANAGER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" }
  }
  const result = await db.etimsQueue.updateMany({
    where: { status: "FAILED" },
    data: { status: "PENDING", attempts: 0, lastError: null },
  })
  revalidatePath("/dashboard/etims")
  return { success: true, data: result.count }
}
