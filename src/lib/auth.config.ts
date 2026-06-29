import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@/lib/generated/prisma"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnPOS = nextUrl.pathname.startsWith("/pos")

      if (isOnDashboard || isOnPOS) {
        if (isLoggedIn) return true
        return false
      }

      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        if (account?.provider === "google") {
          // user.id here is the Google sub — look up our DB record by email
          const { db } = await import("@/lib/db")
          const dbUser = await db.user.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true, branchId: true, name: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.branchId = dbUser.branchId ?? ""
            token.name = dbUser.name
          }
        } else {
          // Credentials providers return our DB user directly
          token.id = user.id
          token.role = (user as { role?: string }).role
          token.branchId = (user as { branchId?: string }).branchId ?? ""
          token.name = user.name
        }
      }

      if (trigger === "update" && token.id) {
        const { db } = await import("@/lib/db")
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, branchId: true, name: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.branchId = dbUser.branchId ?? ""
          token.name = dbUser.name
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.branchId = (token.branchId as string) ?? ""
        session.user.name = token.name as string
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
