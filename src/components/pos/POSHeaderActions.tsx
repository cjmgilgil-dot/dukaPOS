"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function POSHeaderActions() {
  return (
    <button
      onClick={() => signOut({ redirectTo: "/pos" })}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)] transition-colors"
    >
      <LogOut className="h-3.5 w-3.5" />
      Lock
    </button>
  )
}
