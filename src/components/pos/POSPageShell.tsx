"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShiftOpen } from "./ShiftOpen"
import { POSWorkspace } from "./POSWorkspace"
import type { ActiveShift } from "@/lib/shift/types"
import type { Category } from "@/lib/generated/prisma"

interface POSPageShellProps {
  branchId: string
  categories: Category[]
  initialShift: ActiveShift | null
  cashierName: string
  branchName: string
}

export function POSPageShell({
  branchId,
  categories,
  initialShift,
  cashierName,
  branchName,
}: POSPageShellProps) {
  const router = useRouter()
  const [shift, setShift] = useState<ActiveShift | null>(initialShift)
  const [skipped, setSkipped] = useState(false)

  if (!shift && !skipped) {
    return (
      <ShiftOpen
        cashierName={cashierName}
        branchName={branchName}
        onOpen={s => {
          setShift(s)
          router.refresh()
        }}
        onSkip={() => setSkipped(true)}
      />
    )
  }

  return (
    <POSWorkspace
      categories={categories as any}
      branchId={branchId}
      hasActiveShift={!!shift}
    />
  )
}
