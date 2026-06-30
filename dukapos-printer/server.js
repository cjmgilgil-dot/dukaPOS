const express = require("express")
const cors = require("cors")

const app = express()
const PORT = 9100

app.use(cors({ origin: ["http://localhost:3000", "http://127.0.0.1:3000"] }))
app.use(express.json({ limit: "2mb" }))

// Lazy-load escpos so the service starts even if no USB printer is connected
let escpos
let USB
try {
  escpos = require("escpos")
  USB = require("escpos-usb")
  escpos.USB = USB
} catch (err) {
  console.warn("[printer] escpos/escpos-usb not available:", err.message)
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, version: "1.0.0" })
})

app.post("/print", async (req, res) => {
  const { html, openDrawer } = req.body

  if (!html) {
    return res.status(400).json({ error: "html is required" })
  }

  // Try ESC/POS USB printer first
  if (escpos && USB) {
    try {
      const devices = USB.findPrinter()
      if (devices && devices.length > 0) {
        await printEscPos(html, openDrawer)
        return res.json({ ok: true, method: "escpos" })
      }
    } catch (err) {
      console.warn("[printer] ESC/POS failed, falling back to plain text:", err.message)
    }
  }

  // Fallback: plain text via stdout (for testing)
  const text = htmlToText(html)
  process.stdout.write(text + "\n\n")
  res.json({ ok: true, method: "stdout" })
})

function htmlToText(html) {
  return html
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
}

function printEscPos(html, openDrawer) {
  return new Promise((resolve, reject) => {
    const device = new USB()
    const printer = new escpos.Printer(device)
    const text = htmlToText(html)

    device.open((err) => {
      if (err) return reject(err)

      try {
        printer
          .font("a")
          .align("lt")
          .size(1, 1)
          .text(text)
          .cut()

        if (openDrawer) {
          // Standard cash drawer pulse on pin 2
          printer.cashdraw(2)
        }

        printer.close(() => resolve())
      } catch (e) {
        reject(e)
      }
    })
  })
}

app.listen(PORT, "127.0.0.1", () => {
  console.log(`[DukaPOS Printer] Listening on http://127.0.0.1:${PORT}`)
  console.log("[DukaPOS Printer] Health: GET /health")
  console.log("[DukaPOS Printer] Print:  POST /print { html, openDrawer }")
})
