const HOUR_MILLISECONDS = 60 * 60 * 1000

export function getTimeoutMs(timeoutHours: number) {
  return HOUR_MILLISECONDS * timeoutHours
}

export function isTimedOut(createdAt: string, timeoutHours: number) {
  const createdTime = new Date(createdAt).getTime()
  const now = Date.now()
  return now - createdTime > getTimeoutMs(timeoutHours)
}
