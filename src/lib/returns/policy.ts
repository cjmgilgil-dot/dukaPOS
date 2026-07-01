export const returnPolicy = {
  maxDaysAfterPurchase: 30,
  requireManagerApproval: true,
  allowWithoutReceipt: false,
  nonReturnableCategories: [] as string[],
  restockingFeePercent: 0,
}

export function validateReturn(
  sale: { createdAt: Date; status: string },
  overrideExpired = false
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  const daysSincePurchase = Math.floor(
    (Date.now() - new Date(sale.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (sale.status === "VOIDED") {
    errors.push("Cannot return items from a voided sale.")
  }

  if (sale.status === "RETURNED") {
    errors.push("This sale has already been fully returned.")
  }

  if (daysSincePurchase > returnPolicy.maxDaysAfterPurchase && !overrideExpired) {
    errors.push(
      `Return period expired — sale was ${daysSincePurchase} days ago (max ${returnPolicy.maxDaysAfterPurchase} days). Manager override required.`
    )
  }

  if (daysSincePurchase > returnPolicy.maxDaysAfterPurchase && overrideExpired) {
    warnings.push(
      `Return period expired (${daysSincePurchase} days) — manager override applied.`
    )
  }

  return { valid: errors.length === 0, errors, warnings }
}
