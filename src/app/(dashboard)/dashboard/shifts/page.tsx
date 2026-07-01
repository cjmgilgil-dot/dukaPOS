import { getShifts } from "./actions"
import { ShiftTable } from "./components/ShiftTable"
import { OpenShiftsWidget } from "./components/OpenShiftsWidget"

export default async function ShiftsPage() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const result = await getShifts({ from: todayStart })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Shifts</h2>
        <p className="mt-1 text-[var(--color-text-muted)]">Today&apos;s shift activity and Z-Reports.</p>
      </div>

      <OpenShiftsWidget />

      {result.success ? (
        <ShiftTable shifts={result.data} />
      ) : (
        <p className="text-sm text-[var(--color-danger)]">{result.error}</p>
      )}
    </div>
  )
}
