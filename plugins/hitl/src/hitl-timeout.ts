const MINUTE_MILLISECONDS = 60 * 1000

export function getTimeoutMs(timeoutMinutes: number) {
  return MINUTE_MILLISECONDS * timeoutMinutes
}

export function isTimedOut(createdAt: string, timeoutHours: number) {
  const createdTime = new Date(createdAt).getTime()
  const now = Date.now()
  return now - createdTime > getTimeoutMs(timeoutHours)
}
