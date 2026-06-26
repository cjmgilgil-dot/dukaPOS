import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (!["OWNER", "MANAGER", "SUPERVISOR"].includes(session.user.role)) {
    redirect("/pos")
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Sidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-[var(--color-surface-alt)] bg-[var(--color-surface)] px-6">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--color-text-muted)]">
              {session.user.name}
            </span>
            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-[var(--color-primary)]">
              {session.user.role}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
