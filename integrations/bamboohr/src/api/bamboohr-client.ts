import { type z } from '@botpress/sdk'

import {
  bambooHrCompanyInfo,
  bambooHrEmployeeBasicInfoResponse,
  bambooHrEmployeeCustomInfoResponse,
  bambooHrEmployeeDirectoryResponse,
  bambooHrEmployeeWebhookFields,
  bambooHrWebhookCreateResponse,
} from 'definitions'
import { getBambooHrAuthorization } from './auth'
import { parseResponseWithErrors } from './utils'

import * as bp from '.botpress'

const getHeaders = (authorization: string) => ({
  Authorization: authorization,
  'Content-Type': 'application/json',
  Accept: 'application/json',
})

type ClientProps = Pick<bp.HandlerProps, 'ctx' | 'logger' | 'client'>

export class BambooHRClient {
  public baseUrl: string
  private _headers: Record<string, string>
  private _expiresAt: number
  private _props: ClientProps

  public static async create(props: ClientProps): Promise<BambooHRClient> {
    const { authorization, expiresAt } = await getBambooHrAuthorization(props)
    return new BambooHRClient({ subdomain: props.ctx.configuration.subdomain, authorization, expiresAt, props })
  }

  private constructor({
    subdomain,
    authorization,
    expiresAt,
    props,
  }: {
    subdomain: string
    authorization: string
    expiresAt: number
    props: ClientProps
  }) {
    this.baseUrl = `https://${subdomain}.bamboohr.com/api/v1`
    this._expiresAt = expiresAt
    this._headers = getHeaders(authorization)
    this._props = props
  }

  public async _makeRequest({
    url,
    ...params
  }: Pick<RequestInit, 'method' | 'body'> & { url: URL }): Promise<Response> {
    // Refresh token if too close to expiry
    if (Date.now() >= this._expiresAt) {
      const { authorization, expiresAt } = await getBambooHrAuthorization(this._props)
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

  public async testAuthorization(): Promise<boolean> {
    const url = new URL(`${this.baseUrl}/employees/0`)

    const res = await this._makeRequest({ method: 'GET', url })
    return res.ok
  }

  public async createWebhook(webhookUrl: string): Promise<z.infer<typeof bambooHrWebhookCreateResponse>> {
    const url = new URL(`${this.baseUrl}/webhooks`)

    const fields = bambooHrEmployeeWebhookFields.keyof().options
    const body = JSON.stringify({
      name: this._props.ctx.integrationId,
      monitorFields: fields.filter((field) => field !== 'terminationDate'), // terminationDate returns error on monitor
      postFields: fields.reduce((acc, field) => ({ ...acc, [field]: field }), {} as Record<string, string>),
      url: webhookUrl,
      format: 'json',
      limit: {
        times: 1000, // Send at most 1000 records per event
        seconds: 60, // Fire at most once per minute
      },
    })

    const res = await this._makeRequest({ method: 'POST', url, body })
    const result = await parseResponseWithErrors(res, bambooHrWebhookCreateResponse)

    if (!result.success) {
      this._props.logger.forBot().error(result.error, result.details)
      throw new Error(result.error)
    }

    return result.data
  }

  public async deleteWebhook(webhookId: string): Promise<Response> {
    const url = new URL(`${this.baseUrl}/webhooks/${webhookId}`)

    return await this._makeRequest({ method: 'DELETE', url })
  }

  // API Methods

  public async getCompanyInfo(): Promise<z.infer<typeof bambooHrCompanyInfo>> {
    const url = new URL(`${this.baseUrl}/company_information`)

    const res = await this._makeRequest({ method: 'GET', url })
    const result = await parseResponseWithErrors(res, bambooHrCompanyInfo)

    if (!result.success) {
      this._props.logger.forBot().error(result.error, result.details)
      throw new Error(result.error)
    }

    return result.data
  }

  public async getEmployeeBasicInfo(employeeId: string): Promise<z.infer<typeof bambooHrEmployeeBasicInfoResponse>> {
    const url = new URL(`${this.baseUrl}/employees/${employeeId}`)

    const res = await this._makeRequest({ method: 'GET', url })
    const result = await parseResponseWithErrors(res, bambooHrEmployeeBasicInfoResponse)

    if (!result.success) {
      this._props.logger.forBot().error(result.error, result.details)
      throw new Error(result.error)
    }

    return result.data
  }

  public async getEmployeeCustomInfo(
    employeeId: string,
    fields: string[]
  ): Promise<z.infer<typeof bambooHrEmployeeCustomInfoResponse>> {
    const url = new URL(`${this.baseUrl}/employees/${employeeId}`)
    url.searchParams.append('fields', fields.join(','))

    const res = await this._makeRequest({ method: 'GET', url })
    const result = await parseResponseWithErrors(res, bambooHrEmployeeCustomInfoResponse)

    if (!result.success) {
      this._props.logger.forBot().error(result.error, result.details)
      throw new Error(result.error)
    }

    return result.data
  }

  public async getEmployeePhoto(employeeId: string, size: string): Promise<Blob> {
    const url = new URL(`${this.baseUrl}/employees/${employeeId}/photo/${size}`)

    const res = await this._makeRequest({ method: 'GET', url })
    return await res.blob()
  }

  public async listEmployees(): Promise<z.infer<typeof bambooHrEmployeeDirectoryResponse>> {
    const url = new URL(`${this.baseUrl}/employees/directory`)
    const res = await this._makeRequest({ method: 'GET', url })
    const result = await parseResponseWithErrors(res, bambooHrEmployeeDirectoryResponse)

    if (!result.success) {
      this._props.logger.forBot().error(result.error, result.details)
      throw new Error(result.error)
    }

    return result.data
  }
}
