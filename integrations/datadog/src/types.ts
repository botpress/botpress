import { Event, MetricQueryResult } from 'definitions'

export type DatadogEvent = Event.inferredType
export type DatadogMetricQueryResult = MetricQueryResult.inferredType

// Action requests:
export type QueryMetricsRequest = {
  query: string
  from: number
  to: number
}

export type CreateEventRequest = Omit<DatadogEvent, 'id' | 'url' | 'dateHappened'> & {
  title: string
  text: string
}

// Datadog API Response types
export type DatadogApiResponse<T> = T

export type DatadogMetricSeries = {
  metric: string
  display_name?: string
  unit?: Array<{
    family?: string
    scale_factor?: number
    name?: string
    short_name?: string
  }>
  pointlist: Array<[number, number]>
  start: number
  end: number
  interval?: number
  length: number
  expression?: string
  scope?: string
  tag_set?: string[]
}

export type DatadogMetricQueryResponse = {
  query: string
  from: number
  to: number
  series: DatadogMetricSeries[]
  message?: string
  status?: string
}

export type DatadogEventResponse = {
  event: DatadogEvent
  status: string
}

