import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    // Google OAuth — for owner/manager login
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),

    // Email & Password — for owner/manager login
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
          branchId: user.branchId ?? "",
        }
      },
    }),

    // PIN-based login for cashiers at the POS terminal
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
              branchId: user.branchId ?? "",
            }
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      // Credentials pass through — user already exists and was verified by authorize()
      if (account?.provider !== "google") return true
      if (!user.email) return false

      try {
        let dbUser = await db.user.findUnique({ where: { email: user.email } })

        if (!dbUser) {
          const defaultBranch = await db.branch.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
          })
          dbUser = await db.user.create({
            data: {
              email: user.email,
              name: user.name ?? user.email,
              image: user.image ?? null,
              role: "OWNER",
              branchId: defaultBranch?.id ?? null,
            },
          })
        }

        return true
      } catch (err) {
        console.error("[auth] Google signIn DB error:", err)
        throw err // surfaces as error=Configuration with the real message
      }
    },
  },
})
