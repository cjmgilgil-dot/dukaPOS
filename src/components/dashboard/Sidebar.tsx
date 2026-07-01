"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import type { UserRole } from "@/lib/generated/prisma"
import {
  LayoutDashboard,
  Layers,
  Package,
  Warehouse,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Monitor,
  LogOut,
  FileCheck,
  Clock,
  type LucideIcon,
} from "lucide-react"

interface SidebarUser {
  name: string
  role: UserRole
}

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: "Dashboard",  href: "/dashboard",            icon: LayoutDashboard },
  { label: "Categories", href: "/dashboard/categories", icon: Layers },
  { label: "Products",   href: "/dashboard/products",   icon: Package },
  { label: "Inventory",  href: "/dashboard/inventory",  icon: Warehouse },
  { label: "Sales",      href: "/dashboard/sales",      icon: Receipt },
  { label: "Shifts",     href: "/dashboard/shifts",     icon: Clock },
  { label: "Customers",  href: "/dashboard/customers",  icon: Users },
  { label: "eTIMS",      href: "/dashboard/etims",      icon: FileCheck },
  { label: "Reports",    href: "/dashboard/reports",    icon: BarChart3 },
  { label: "Settings",   href: "/dashboard/settings",   icon: Settings },
]

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 flex-col border-r border-[var(--color-surface-alt)] bg-[var(--color-surface)]">
      {/* Open POS link */}
      <div className="border-b border-[var(--color-surface-alt)] p-4">
        <Link
          href="/pos"
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <Monitor className="h-4 w-4" />
          Open POS Terminal
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-500/15 text-[var(--color-primary)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info + sign out */}
      <div className="border-t border-[var(--color-surface-alt)] p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--color-text)]">
              {user.name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ redirectTo: "/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
