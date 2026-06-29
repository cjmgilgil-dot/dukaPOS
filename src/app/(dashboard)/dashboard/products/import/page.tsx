"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Papa from "papaparse"
import { toast } from "sonner"
import { Upload, Download, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { importProductsFromCsv } from "./actions"

const REQUIRED_HEADERS = ["sku", "name", "price"]
const TEMPLATE_HEADERS = "sku,name,category,unit,price,cost,stock,reorderLevel,taxRate,barcode"
const TEMPLATE_ROW = "EL-TC-2.5,2.5mm² Twin Cable,Electrical,METER,35,22,500,100,16,"

type ImportState = {
  created: number
  skipped: number
  errors: string[]
} | null

export default function ImportProductsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportState>(null)

  function handleFile(file: File) {
    setResult(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const data = results.data as any[]
        const headers = Object.keys(data[0] ?? {}).map((h) => h.toLowerCase().trim())
        const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
        if (missing.length > 0) {
          toast.error(`Missing required columns: ${missing.join(", ")}`)
          return
        }
        // normalise keys
        const normalised = data.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v])
          )
        )
        setRows(normalised)
        setPreview(normalised.slice(0, 5))
        toast.success(`${data.length} rows parsed — ready to import`)
      },
      error() {
        toast.error("Failed to parse CSV")
      },
    })
  }

  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)
    try {
      const res = await importProductsFromCsv(rows)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setResult(res)
      toast.success(`Imported ${res.created} product(s)`)
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const blob = new Blob([`${TEMPLATE_HEADERS}\n${TEMPLATE_ROW}`], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "dukapos-products-template.csv"
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/products"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Import Products</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Upload a CSV file to bulk-import products.
          </p>
        </div>
      </div>

      {/* Template */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <h3 className="font-semibold text-[var(--color-text)]">CSV Format</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Required: <code className="font-mono text-xs bg-[var(--color-surface-alt)] px-1 py-0.5 rounded">sku</code>,{" "}
          <code className="font-mono text-xs bg-[var(--color-surface-alt)] px-1 py-0.5 rounded">name</code>,{" "}
          <code className="font-mono text-xs bg-[var(--color-surface-alt)] px-1 py-0.5 rounded">price</code>.{" "}
          Optional: category, unit, cost, stock, reorderLevel, taxRate, barcode.
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Unit values: PIECE, METER, KILOGRAM, GRAM, LITER, BOX, PACK, ROLL, PAIR, SET, etc.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
          <Download className="mr-1.5 h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Upload */}
      <div
        className="flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-primary)]"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        <Upload className="h-8 w-8 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-muted)]">
          Drop CSV here or <span className="text-[var(--color-primary)] font-medium">browse</span>
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[var(--color-text)]">
            Preview — first {preview.length} of {rows.length} rows
          </h3>
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                  {Object.keys(preview[0]).map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-[var(--color-text-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)] last:border-0 bg-[var(--color-surface)]">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-3 py-2 text-[var(--color-text)]">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing…" : `Import ${rows.length} products`}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setRows([]); setPreview([]); setResult(null) }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
            <span className="font-semibold text-[var(--color-text)]">Import complete</span>
          </div>
          <ul className="space-y-1 text-sm">
            <li className="text-[var(--color-success)]">✓ Created: {result.created}</li>
            <li className="text-[var(--color-text-muted)]">Skipped (already exists): {result.skipped}</li>
          </ul>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-danger)]">
                <XCircle className="h-4 w-4" /> Errors
              </p>
              <ul className="space-y-0.5 text-xs text-[var(--color-danger)]">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard/products")}>
            View Products
          </Button>
        </div>
      )}
    </div>
  )
}
