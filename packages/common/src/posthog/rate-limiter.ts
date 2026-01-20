export class PostHogRateLimiter {
  private _probability: number

  private constructor(probability: number) {
    this._probability = probability
  }

  public shouldAllow(): boolean {
    return Math.random() <= this._probability
  }

  public static create(percentage: number): PostHogRateLimiter {
    if (percentage <= 0 || percentage > 100 || !Number.isInteger(percentage)) {
      throw new Error('Probability must be an integer between 1 and 100')
    }

    return new PostHogRateLimiter(percentage / 100)
  }
}
