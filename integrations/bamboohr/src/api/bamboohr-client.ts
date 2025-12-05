import { type z } from '@botpress/sdk'

import {
  bambooHrCompanyInfo,
  bambooHrEmployeeBasicInfoResponse,
  bambooHrEmployeeCustomInfoResponse,
  bambooHrEmployeeDirectoryResponse,
  bambooHrWebhookCreateResponse,
} from 'definitions'
import * as types from '../types'
import { BambooHRAuthorization, getCurrentBambooHrAuthorization, refreshBambooHrAuthorization } from './auth'
import { parseResponseWithErrors } from './utils'

const getHeaders = (authorization: string) => ({
  Authorization: authorization,
  'Content-Type': 'application/json',
  Accept: 'application/json',
})

export class BambooHRClient {
  private _baseUrl: string
  private _currentAuth: BambooHRAuthorization
  private _props: types.CommonHandlerProps

  public static async create(props: types.CommonHandlerProps): Promise<BambooHRClient> {
    const currentAuth = await getCurrentBambooHrAuthorization(props)
    return new BambooHRClient({ subdomain: currentAuth.domain, props, currentAuth })
  }

  private constructor({
    subdomain,
    props,
    currentAuth,
  }: {
    subdomain: string
    props: types.CommonHandlerProps
    currentAuth: BambooHRAuthorization
  }) {
    this._baseUrl = `https://${subdomain}.bamboohr.com/api/v1`
    this._props = props
    this._currentAuth = currentAuth
  }

  private async _makeRequest({
    url,
    ...params
  }: Pick<RequestInit, 'method' | 'body'> & { url: URL }): Promise<Response> {
    // Refresh token if too close to expiry
    if (Date.now() >= this._currentAuth.expiresAt) {
      this._currentAuth = await refreshBambooHrAuthorization(this._props, this._currentAuth)
    }

    const headers = getHeaders(this._currentAuth.authorization)
    const res = await fetch(url, { ...params, headers })
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
    const url = new URL(`${this._baseUrl}/employees/0`)

    const res = await this._makeRequest({ method: 'GET', url })
    return res.ok
  }

  public async createWebhook(
    webhookUrl: string,
    fields: string[]
  ): Promise<z.infer<typeof bambooHrWebhookCreateResponse>> {
    const url = new URL(`${this._baseUrl}/webhooks`)

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
    const url = new URL(`${this._baseUrl}/webhooks/${webhookId}`)

    return await this._makeRequest({ method: 'DELETE', url })
  }

  // API Methods

  public async getMonitoredFields(): Promise<string[]> {
    const url = new URL(`${this._baseUrl}/webhooks/monitor_fields`)
    const res = await this._makeRequest({ method: 'GET', url })
    const result = await res.json()
    if ('fields' in result) {
      return result.fields.map((field: { alias: string }) => field.alias).filter((field: string) => field !== null)
    }
    return []
  }

  public async getCompanyInfo(): Promise<z.infer<typeof bambooHrCompanyInfo>> {
    const url = new URL(`${this._baseUrl}/company_information`)

    const res = await this._makeRequest({ method: 'GET', url })
    const result = await parseResponseWithErrors(res, bambooHrCompanyInfo)

    if (!result.success) {
      this._props.logger.forBot().error(result.error, result.details)
      throw new Error(result.error)
    }

    return result.data
  }

  public async getEmployeeBasicInfo(employeeId: string): Promise<z.infer<typeof bambooHrEmployeeBasicInfoResponse>> {
    const url = new URL(`${this._baseUrl}/employees/${employeeId}`)

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
    const url = new URL(`${this._baseUrl}/employees/${employeeId}`)
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
    const url = new URL(`${this._baseUrl}/employees/${employeeId}/photo/${size}`)

    const res = await this._makeRequest({ method: 'GET', url })
    return await res.blob()
  }

  public async listEmployees(): Promise<z.infer<typeof bambooHrEmployeeDirectoryResponse>> {
    const url = new URL(`${this._baseUrl}/employees/directory`)
    const res = await this._makeRequest({ method: 'GET', url })
    const result = await parseResponseWithErrors(res, bambooHrEmployeeDirectoryResponse)

    if (!result.success) {
      this._props.logger.forBot().error(result.error, result.details)
      throw new Error(result.error)
    }

    return result.data
  }
}
