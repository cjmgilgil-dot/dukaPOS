import type { ReceiptData } from "./builder"

// Deterministic KES formatter — no toLocaleString, no locale fallback risk
function fmt(amount: number): string {
  const [int, dec] = amount.toFixed(2).split(".")
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `KES ${withCommas}.${dec}`
}

// Left label, right-aligned value, padded to exactly `width` chars
function line(left: string, right: string, width: number): string {
  const maxLeft = width - right.length - 1
  const l = left.slice(0, maxLeft)
  const spaces = width - l.length - right.length
  return l + " ".repeat(Math.max(1, spaces)) + right
}

function divider(width: number, char = "-"): string {
  return char.repeat(width)
}

// 80mm paper at 12px Courier New: ~7.2px/char, ~286px usable → 39 chars safe
// 58mm paper: ~219px usable → 28 chars safe
const COL_WIDTH = { "80mm": 40, "58mm": 28 } as const

export function generateReceiptHTML(data: ReceiptData, paperWidth: "80mm" | "58mm"): string {
  const colWidth = COL_WIDTH[paperWidth]
  const pxWidth = paperWidth

  const dateStr = data.saleDate.toLocaleDateString("en-KE", {
    day: "2-digit", month: "short", year: "numeric",
  })
  const timeStr = data.saleDate.toLocaleTimeString("en-KE", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  })

  const rows: string[] = []

  // ── Header (shop identity) ──────────────────────────────────
  rows.push(data.shopName.toUpperCase())
  if (data.shopAddress) rows.push(data.shopAddress)
  if (data.shopPhone) rows.push(`Tel: ${data.shopPhone}`)
  if (data.shopKraPIN) rows.push(`PIN: ${data.shopKraPIN}`)
  rows.push(divider(colWidth, "="))

  // ── Sale metadata ───────────────────────────────────────────
  rows.push(`Receipt: ${data.saleNumber}`)
  rows.push(`Date:    ${dateStr}  ${timeStr}`)
  rows.push(`Cashier: ${data.cashierName}`)
  if (data.customerName) rows.push(`Customer: ${data.customerName}`)
  if (data.customerKraPIN) rows.push(`Cust PIN: ${data.customerKraPIN}`)
  rows.push(divider(colWidth))

  // ── Items header ────────────────────────────────────────────
  rows.push(line("ITEM", "TOTAL", colWidth))
  rows.push(divider(colWidth))

  // ── Line items ──────────────────────────────────────────────
  for (const item of data.items) {
    const itemName = item.variantName !== "Default"
      ? `${item.name} (${item.variantName})`
      : item.name

    // Wrap long names at colWidth
    for (let i = 0; i < itemName.length; i += colWidth) {
      rows.push((i === 0 ? "" : "  ") + itemName.slice(i, i + colWidth))
    }

    // Qty × unit price → line total
    const qtyLine = `  ${item.quantity} x ${fmt(item.unitPrice)}`
    rows.push(line(qtyLine, fmt(item.lineTotal), colWidth))

    if (item.discount > 0) {
      rows.push(line("  Discount", `-${fmt(item.discount)}`, colWidth))
    }
  }

  rows.push(divider(colWidth))

  // ── Totals ──────────────────────────────────────────────────
  rows.push(line("Subtotal", fmt(data.subtotal), colWidth))
  if (data.discount > 0) {
    rows.push(line("Discount", `-${fmt(data.discount)}`, colWidth))
  }
  rows.push(line("VAT (16%)", fmt(data.taxTotal), colWidth))
  rows.push(divider(colWidth, "="))
  rows.push(line("TOTAL", fmt(data.total), colWidth))
  rows.push(divider(colWidth, "="))

  // ── Payments ────────────────────────────────────────────────
  for (const payment of data.payments) {
    rows.push(line(payment.label, fmt(payment.amount), colWidth))
    if (payment.reference) {
      rows.push(`  Ref: ${payment.reference}`)
    }
  }
  if (data.changeAmount > 0) {
    rows.push(line("Change", fmt(data.changeAmount), colWidth))
  }

  rows.push(divider(colWidth))

  // ── eTIMS ───────────────────────────────────────────────────
  if (data.etimsInvoiceNumber) {
    rows.push("KRA eTIMS VERIFIED")
    rows.push(`CUIN: ${data.etimsInvoiceNumber}`)
    rows.push(divider(colWidth))
  }

  // ── Footer ──────────────────────────────────────────────────
  rows.push(data.footerText)
  rows.push("")
  rows.push(data.returnPolicy)

  const bodyText = rows.join("\n")

  const qrBlock = data.etimsQRCodeDataURL
    ? `<div style="text-align:center;margin:8px 0;">
        <img src="${data.etimsQRCodeDataURL}" width="120" height="120" alt="KRA QR" style="display:inline-block;" />
        <div style="font-size:9px;margin-top:4px;">Scan to verify with KRA</div>
       </div>`
    : ""

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${data.saleNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Courier New", Courier, monospace;
    font-size: 12px;
    line-height: 1.45;
    width: ${pxWidth};
    padding: 6px 8px;
    color: #000;
    background: #fff;
  }
  pre {
    white-space: pre;
    overflow: hidden;
    font-family: inherit;
    font-size: inherit;
  }
  @media print {
    @page {
      size: ${pxWidth} auto;
      margin: 0;
    }
    body { padding: 4px 6px; }
  }
</style>
</head>
<body>
<pre>${bodyText}</pre>
${qrBlock}
</body>
</html>`
}
