import { type z } from '@botpress/sdk'

import { bambooHrEmployeeWebhookFields, bambooHrWebhookCreateResponse } from 'definitions'
import { getBambooHrAuthorization } from './auth'
import { parseResponseWithErrors } from './utils'

import * as bp from '.botpress'

const getHeaders = (authorization: string) => ({
  Authorization: authorization,
  'Content-Type': 'application/json',
  Accept: 'application/json',
})

type CommonHandlerProps = Pick<bp.HandlerProps, 'ctx' | 'client'>

export class BambooHRClient {
  public baseUrl: string
  private _headers: Record<string, string>
  private _expiresAt: number

  public static async create(props: CommonHandlerProps): Promise<BambooHRClient> {
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
    props: CommonHandlerProps,
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
      throw new Error(
        `BambooHR API request failed with status ${res.status} ${res.statusText}` +
          (additionalInfo ? `: ${additionalInfo}` : '')
      )
    }
    return res
  }

  public async testAuthorization(props: CommonHandlerProps): Promise<boolean> {
    const url = new URL(`${this.baseUrl}/employees/0`)

    const res = await this.makeRequest(props, { method: 'GET', url })
    return res.ok
  }

  public async createWebhook(
    props: CommonHandlerProps,
    webhookUrl: string
  ): Promise<z.infer<typeof bambooHrWebhookCreateResponse>> {
    const url = new URL(`${this.baseUrl}/webhooks`)

    const fields = bambooHrEmployeeWebhookFields.keyof().options
    const body = JSON.stringify({
      name: props.ctx.integrationId,
      monitorFields: fields.filter((field) => field !== 'terminationDate'), // terminationDate returns error on monitor
      postFields: fields.reduce((acc, field) => ({ ...acc, [field]: field }), {} as Record<string, string>),
      url: webhookUrl,
      format: 'json',
      limit: {
        times: 1000, // Send at most 1000 records per event
        seconds: 60, // Fire at most once per minute
      },
    })

    const res = await this.makeRequest(props, { method: 'POST', url, body })
    return parseResponseWithErrors(res, bambooHrWebhookCreateResponse)
  }

  public async deleteWebhook(props: CommonHandlerProps, webhookId: string): Promise<Response> {
    const url = new URL(`${this.baseUrl}/webhooks/${webhookId}`)

    return await this.makeRequest(props, { method: 'DELETE', url })
  }
}
