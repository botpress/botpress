import { handleErrorsDecorator as handleErrors } from './error-handling'
import {
  CreateEventRequest,
  DatadogEvent,
  DatadogEventResponse,
  DatadogMetricQueryResponse,
  DatadogMetricQueryResult,
  QueryMetricsRequest,
} from './types'
import * as bp from '.botpress'

export class DatadogClient {
  private readonly _apiKey: string
  private readonly _appKey: string
  private readonly _site: string
  private readonly _baseUrl: string

  private constructor({ apiKey, appKey, site }: { apiKey: string; appKey: string; site: string }) {
    this._apiKey = apiKey
    this._appKey = appKey
    this._site = site || 'datadoghq.com'
    this._baseUrl = `https://api.${this._site}`
  }

  public static async create({ ctx, client }: { ctx: bp.Context; client: bp.Client }) {
    return new DatadogClient({
      apiKey: ctx.configuration.apiKey,
      appKey: ctx.configuration.appKey,
      site: ctx.configuration.site || 'datadoghq.com',
    })
  }

  private async _makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this._baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'DD-API-KEY': this._apiKey,
      'DD-APPLICATION-KEY': this._appKey,
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      const error = new Error(`Datadog API error: ${response.status} ${response.statusText}`)
      ;(error as any).response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      }
      throw error
    }

    return response.json()
  }

  @handleErrors('Failed to query metrics')
  public async queryMetrics({ query, from, to }: QueryMetricsRequest): Promise<DatadogMetricQueryResult> {
    const params = new URLSearchParams({
      query,
      from: from.toString(),
      to: to.toString(),
    })

    const response = await this._makeRequest<DatadogMetricQueryResponse>(`GET`, `/api/v1/query?${params.toString()}`)

    return {
      query: response.query,
      from: response.from,
      to: response.to,
      series: response.series.map((series) => ({
        metric: series.metric,
        displayName: series.display_name,
        unit: series.unit,
        pointlist: series.pointlist,
        start: series.start,
        end: series.end,
        interval: series.interval,
        length: series.length,
        expression: series.expression,
        scope: series.scope,
        tagSet: series.tag_set,
      })),
      message: response.message,
      status: response.status,
    }
  }

  @handleErrors('Failed to create event')
  public async createEvent({ title, text, ...eventData }: CreateEventRequest): Promise<DatadogEvent> {
    const payload: any = {
      title,
      text,
      ...eventData,
    }

    // Remove undefined values
    const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, value]) => value !== undefined))

    const response = await this._makeRequest<DatadogEventResponse>('POST', '/api/v1/events', cleanPayload)

    return {
      id: response.event.id,
      title: response.event.title,
      text: response.event.text,
      dateHappened: response.event.dateHappened,
      handle: response.event.handle,
      relatedEventId: response.event.relatedEventId,
      tags: response.event.tags,
      url: response.event.url,
      priority: response.event.priority,
      source: response.event.source,
      alertType: response.event.alertType,
      deviceName: response.event.deviceName,
      host: response.event.host,
      aggregationKey: response.event.aggregationKey,
    }
  }
}

export { wrapAsyncFnWithTryCatch } from './error-handling'
