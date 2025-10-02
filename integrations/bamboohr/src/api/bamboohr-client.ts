import { RuntimeError } from '@botpress/sdk'
import { getBambooHrAuthorization } from './auth'

import * as bp from '.botpress'

const getHeaders = (authorization: string) => ({
  Authorization: authorization,
  'Content-Type': 'application/json',
  Accept: 'application/json',
})

type RestrictedHandlerProps = Pick<bp.HandlerProps, 'ctx' | 'client'>

export class BambooHRClient {
  public baseUrl: string
  private _headers: Record<string, string>
  private _expiresAt: number

  public static async create(props: RestrictedHandlerProps): Promise<BambooHRClient> {
    const { authorization, expiresAt } = await getBambooHrAuthorization(props)
    return new BambooHRClient({ subdomain: props.ctx.configuration.subdomain, authorization, expiresAt })
  }

  private constructor({
    subdomain,
    authorization,
    expiresAt,
  }: Pick<bp.configuration.Configuration, 'subdomain'> & Awaited<ReturnType<typeof getBambooHrAuthorization>>) {
    this.baseUrl = `https://${subdomain}.bamboohr.com/api/v1`
    this._expiresAt = expiresAt
    this._headers = getHeaders(authorization)
  }

  public async makeRequest(
    props: RestrictedHandlerProps,
    { url, ...params }: Pick<RequestInit, 'method' | 'body'> & { url: URL }
  ): Promise<Response> {
    // Refresh token if too close to expiry
    if (Date.now() >= this._expiresAt) {
      const { authorization, expiresAt } = await getBambooHrAuthorization(props)
      this._expiresAt = expiresAt
      this._headers = getHeaders(authorization)
    }

    const res = await fetch(url, { ...params, headers: this._headers })
    if (!res.ok) {
      // Custom error header from BambooHR with more details
      const additionalInfo = res.headers.get('x-bamboohr-error-message')
      throw new RuntimeError(
        `BambooHR API request failed with status ${res.status} ${res.statusText}` +
          (additionalInfo ? `: ${additionalInfo}` : '')
      )
    }
    return res
  }

  public async testAuthorization(props: RestrictedHandlerProps): Promise<boolean> {
    const url = new URL(`${this.baseUrl}/employees/0`)

    const res = await this.makeRequest(props, { method: 'GET', url })
    return res.ok
  }
}
