import Script from "next/script"
import { auth } from "@/lib/auth"
import { POSHeaderActions } from "@/components/pos/POSHeaderActions"
import { EtimsStatusPill } from "@/components/pos/EtimsStatusPill"

export default async function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = session?.user

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="flex h-12 items-center justify-between border-b border-[var(--color-surface-alt)] bg-[var(--color-surface)] px-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[var(--color-primary)]">DukaPOS</span>
          {user && (
            <>
              <span className="text-xs text-[var(--color-text-muted)]">|</span>
              <span className="text-xs text-[var(--color-text-muted)]">{user.name}</span>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-[var(--color-primary)]">
                {user.role}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
            <span className="text-xs text-[var(--color-text-muted)]">Online</span>
          </div>
          <EtimsStatusPill />
          {user && <POSHeaderActions />}
        </div>
      </header>
      <main className="h-[calc(100vh-3rem)]">{children}</main>
      <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />
    </div>
  )
}
