import type { NextAuthConfig } from "next-auth"

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.branchId = (user as { branchId: string }).branchId
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.branchId = token.branchId as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
