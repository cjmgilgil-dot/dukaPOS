import { getReturns } from "./actions"
import { ReturnsTable } from "./components/ReturnsTable"

export default async function ReturnsPage() {
  const result = await getReturns()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Returns</h2>
        <p className="mt-1 text-[var(--color-text-muted)]">Customer returns and refund history.</p>
      </div>

      {result.success ? (
        <ReturnsTable returns={result.data} />
      ) : (
        <p className="text-sm text-[var(--color-danger)]">{result.error}</p>
      )}
    </div>
  )
}
