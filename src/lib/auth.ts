import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string, isActive: true },
          include: { branch: true },
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branchId: user.branchId,
        }
      },
    }),
    Credentials({
      id: "pin",
      name: "PIN Login",
      credentials: {
        pin: { label: "PIN", type: "password" },
        branchId: { label: "Branch ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.pin || !credentials?.branchId) return null

        const users = await db.user.findMany({
          where: {
            branchId: credentials.branchId as string,
            isActive: true,
            pinHash: { not: null },
          },
        })

        for (const user of users) {
          if (!user.pinHash) continue
          const isValid = await bcrypt.compare(
            credentials.pin as string,
            user.pinHash
          )
          if (isValid) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              branchId: user.branchId,
            }
          }
        }

        return null
      },
    }),
  ],
})
