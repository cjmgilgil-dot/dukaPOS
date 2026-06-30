"use client"

const SERVICE_URL = "http://localhost:9100"
const TIMEOUT_MS = 3000

export async function isLocalPrinterAvailable(): Promise<boolean> {
  // .catch() is on the fetch itself, not just the await, to prevent browser-extension
  // fetch wrappers from leaking an unhandledRejection alongside the caught error.
  const res = await fetch(`${SERVICE_URL}/health`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null)
  return res?.ok ?? false
}

export async function sendToLocalPrinter(html: string, openDrawer: boolean): Promise<void> {
  const res = await fetch(`${SERVICE_URL}/print`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, openDrawer }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error")
    throw new Error(`Print service error: ${text}`)
  }
}
