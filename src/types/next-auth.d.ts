import { UserRole } from "@/lib/generated/prisma"
import "next-auth"

declare module "next-auth" {
  interface User {
    role: UserRole
    branchId: string
  }

  interface Session {
    user: {
      id: string
      email: string | null
      name: string
      role: UserRole
      branchId: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    branchId: string
  }
}
