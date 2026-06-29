"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingCredentials, setLoadingCredentials] = useState(false)

  const handleGoogleLogin = async () => {
    setError("")
    setLoadingGoogle(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch {
      setError("Could not start Google sign-in. Try again.")
      setLoadingGoogle(false)
    }
    // page will redirect on success — no need to reset loading
  }

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoadingCredentials(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoadingCredentials(false)
    }
  }

  const anyLoading = loadingGoogle || loadingCredentials

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-700 bg-slate-800 p-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-orange-500">DukaPOS</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your shop
          </p>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={anyLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingGoogle ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Redirecting to Google…
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-800 px-2 text-slate-400">
              or sign in with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@dukapos.co.ke"
              required
              disabled={anyLoading}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={anyLoading}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={anyLoading}
            className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            {loadingCredentials ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Cashier?{" "}
          <a href="/pos" className="text-orange-500 hover:underline">
            Go to POS terminal
          </a>
        </p>
      </div>
    </div>
  )
}
