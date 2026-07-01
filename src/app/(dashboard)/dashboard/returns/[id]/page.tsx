import { notFound } from "next/navigation"
import { getReturnDetail } from "../actions"
import { ReturnDetail } from "../components/ReturnDetail"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function ReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getReturnDetail(id)
  if (!result.success) notFound()

  const ret = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Link href="/dashboard/returns" className="flex items-center gap-1 hover:text-[var(--color-text)] transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Returns
        </Link>
        <span>/</span>
        <span className="font-mono text-[var(--color-text)]">{ret.returnNumber}</span>
      </div>

      <ReturnDetail ret={ret} />
    </div>
  )
}
