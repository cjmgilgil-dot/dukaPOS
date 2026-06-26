import { auth } from "@/lib/auth"
import { PinLockScreen } from "@/components/pos/PinLockScreen"

export default async function POSPage() {
  const session = await auth()

  return (
    <div className="flex h-full items-center justify-center">
      <PinLockScreen branchId={session!.user.branchId} />
    </div>
  )
}
