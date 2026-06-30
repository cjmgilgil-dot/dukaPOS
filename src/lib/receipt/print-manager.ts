"use client"

import { isLocalPrinterAvailable, sendToLocalPrinter } from "./print-service"
import { browserPrint } from "./browser-print"

export type PrintSource = "local-service" | "browser"

export interface PrintResult {
  source: PrintSource
}

export async function printReceipt(
  html: string,
  options: { openDrawer?: boolean } = {}
): Promise<PrintResult> {
  const localAvailable = await isLocalPrinterAvailable()

  if (localAvailable) {
    try {
      await sendToLocalPrinter(html, options.openDrawer ?? false)
      return { source: "local-service" }
    } catch {
      // Fall through to browser print
    }
  }

  browserPrint(html)
  return { source: "browser" }
}
