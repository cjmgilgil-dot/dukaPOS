export interface PrintSettings {
  autoPrint: boolean
  paperWidth: "80mm" | "58mm"
  showLogo: boolean
  footerText: string
  returnPolicy: string
  openDrawerOnCash: boolean
}

export const defaultPrintSettings: PrintSettings = {
  autoPrint: true,
  paperWidth: "80mm",
  showLogo: false,
  footerText: "Thank you for shopping with us!",
  returnPolicy: "Goods once sold are not refundable unless accompanied by receipt",
  openDrawerOnCash: true,
}
