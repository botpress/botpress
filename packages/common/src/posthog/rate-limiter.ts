export type RateLimitKey = string
type RateLimitWindow = { count: number; windowStart: number }

export class PostHogRateLimiter {
  private _limits: Map<RateLimitKey, RateLimitWindow> = new Map()
  private readonly _maxEventsPerWindow: number
  private readonly _windowMs: number

  public constructor(maxEventsPerWindow = 100, windowMs = 60000) {
    this._maxEventsPerWindow = maxEventsPerWindow
    this._windowMs = windowMs
  }

  public shouldAllow(key: RateLimitKey): boolean {
    const now = Date.now()
    const window = this._limits.get(key)

    if (!window || now - window.windowStart > this._windowMs) {
      this._limits.set(key, { count: 1, windowStart: now })
      return true
    }

    if (window.count >= this._maxEventsPerWindow) {
      window.count++
      return false
    }

    window.count++
    return true
  }

  public getSuppressedCount(key: RateLimitKey): number {
    const window = this._limits.get(key)
    return window ? Math.max(0, window.count - this._maxEventsPerWindow) : 0
  }

  public getWindowStart(key: RateLimitKey): number {
    const window = this._limits.get(key)
    return window?.windowStart ?? Date.now()
  }

  public cleanup(): void {
    const now = Date.now()
    for (const [key, window] of this._limits.entries()) {
      if (now - window.windowStart > this._windowMs * 2) {
        this._limits.delete(key)
      }
    }
  }
}
