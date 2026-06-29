interface PaystackPopResponse {
  reference: string
  trans: string
  status: string
  message: string
  transaction: string
  trxref: string
}

interface PaystackPopSetup {
  openIframe(): void
}

interface PaystackPopInterface {
  setup(options: {
    key: string
    email: string
    amount: number
    currency?: string
    ref?: string
    metadata?: Record<string, unknown>
    callback(response: PaystackPopResponse): void
    onClose(): void
  }): PaystackPopSetup
}

declare const PaystackPop: PaystackPopInterface
