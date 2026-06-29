import crypto from "crypto"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const BASE_URL = "https://api.paystack.co"

export async function paystackRequest<T = any>(
  endpoint: string,
  options: { method?: "GET" | "POST"; body?: Record<string, unknown> } = {}
): Promise<{ status: boolean; message: string; data: T }> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  })
  return res.json()
}

export function generateReference(): string {
  return `DUKA-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex")
  return hash === signature
}

// KES amounts are in kobo (smallest unit) on Paystack: KES × 100
export const toKobo = (kes: number) => Math.round(kes * 100)
export const fromKobo = (kobo: number) => kobo / 100
