import * as sdk from '@botpress/sdk'
import { formatLinkedInError } from './linkedin-oauth-client'
import * as bp from '.botpress'

const LINKEDIN_REST_BASE_URL = 'https://api.linkedin.com/rest'
const LINKEDIN_API_VERSION = '202511'

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export class LinkedInBaseApi {
  protected readonly accessToken: string
  protected readonly baseUrl = LINKEDIN_REST_BASE_URL
  protected readonly apiVersion = LINKEDIN_API_VERSION
  protected readonly logger: bp.Logger

  public constructor(accessToken: string, logger: bp.Logger) {
    this.accessToken = accessToken
    this.logger = logger
  }

  private async _fetch(path: string, options: RequestOptions = {}): Promise<Response> {
    const { method = 'GET', body, headers = {} } = options

    const url = `${this.baseUrl}${path}`

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': this.apiVersion,
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    })

    return response
  }

  /**
   * Makes an HTTP request with automatic exponential retry logic for rate limits and custom error handling.
   *
   * @param successStatuses - Additional HTTP status codes to treat as successful (beyond the default 200-299 range).
   *                          Useful when APIs use non-2xx codes like 201 (Created) or 204 (No Content) to indicate success.
   */
  protected async fetchWithErrorHandling(
    path: string,
    options: RequestOptions,
    errorContext: string,
    { successStatuses }: { successStatuses?: number[] } = {}
  ): Promise<Response> {
    const maxRetries = 3
    const method = options.method ?? 'GET'
    const startTime = Date.now()

    this.logger.forBot().debug(`LinkedIn API request: ${method} ${path}`)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await this._fetch(path, options)

      if (response.status === 429) {
        if (attempt === maxRetries) {
          this.logger.forBot().error(`LinkedIn API rate limit exceeded after ${maxRetries} retries`, { path, method })
          throw new sdk.RuntimeError(`${errorContext}: Rate limit exceeded after ${maxRetries} retries`)
        }
        const delayMs = this._getRetryDelayMs(attempt)
        this.logger.forBot().warn(`LinkedIn API rate limited, retrying in ${Math.round(delayMs)}ms`, {
          path,
          attempt: attempt + 1,
          maxRetries,
        })
        await this._sleep(delayMs)
        continue
      }

      const isSuccess = response.ok || successStatuses?.includes(response.status)
      if (!isSuccess) {
        const errorMsg = await formatLinkedInError(response, errorContext)
        this.logger.forBot().error(`LinkedIn API request failed: ${method} ${path}`, {
          status: response.status,
          duration: Date.now() - startTime,
        })
        throw new sdk.RuntimeError(errorMsg)
      }

      this.logger.forBot().debug(`LinkedIn API request completed: ${method} ${path}`, {
        status: response.status,
        duration: Date.now() - startTime,
      })

      return response
    }

    throw new sdk.RuntimeError(`${errorContext}: Unexpected retry loop exit`)
  }

  private _getRetryDelayMs(attempt: number): number {
    const baseDelayMs = Math.pow(2, attempt) * 1000
    const jitterMs = Math.random() * 1000
    return baseDelayMs + jitterMs
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
