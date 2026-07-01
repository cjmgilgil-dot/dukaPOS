export function shiftDuration(openedAt: Date, closedAt?: Date | null): string {
  const end = closedAt ?? new Date()
  const ms = end.getTime() - openedAt.getTime()
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}
