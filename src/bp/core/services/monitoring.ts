import { injectable } from 'inversify'
import _ from 'lodash'

/**
 * These methods are exposed outside the class to add minimal overhead when collecting metrics
 * It also avoids possible circular reference (the logger class can't access monitoring service, for example)
 */
let metricCollectionEnabled = false
let metricsContainer: MetricsContainer = {}

export const resetMetrics = () => {
  metricsContainer = {
    'requests.count': 0,
    'eventsIn.count': 0,
    'eventsOut.count': 0,
    'warnings.count': 0,
    'errors.count': 0
  }
}

export const getMetrics = () => {
  const metrics: Partial<MonitoringMetrics> = {}
  for (const pathMetric in metricsContainer) {
    _.set(metrics, pathMetric, metricsContainer[pathMetric])
  }

  if (metrics.requests && metrics.requests.count && metrics.requests.latency_sum) {
    metrics.requests.latency_avg = metrics.requests.latency_sum / metrics.requests.count
  }

  return metrics as MonitoringMetrics
}

export const setMetricsCollection = enabled => {
  metricCollectionEnabled = enabled
}

export const incrementMetric = (metricName: string, value?: number | undefined) => {
  if (!metricCollectionEnabled) {
    return
  }
  const realValue = value !== undefined ? value : 1

  if (!metricsContainer[metricName]) {
    metricsContainer[metricName] = realValue
  } else {
    metricsContainer[metricName] += realValue
  }
}

/**
 * Simple structure to hold the complete path of the metric and the desired value.
 * The object will be constructed to a MonitoringMetrics afterwards
 */
export interface MetricsContainer {
  [metricName: string]: number
}

export type MonitoringStats = MonitoringMetrics & {
  host: string
  ts: number
  uptime: number
  cpu: {
    usage: number
  }
  mem: {
    usage: number
    free: number
  }
}

export interface MonitoringMetrics {
  requests: {
    count: number
    latency_avg: number
    latency_sum: number
  }
  eventsIn: {
    count: number
  }
  eventsOut: { count: number }
  warnings: { count: number }
  errors: { count: number }
}

export interface MonitoringService {
  start(): Promise<void>
  stop(): void
  getStats(dateFrom, dateTo): any
  getStatus(): any
  getRedisFactory(): any
}

@injectable()
export class CEMonitoringService implements MonitoringService {
  async start(): Promise<void> {}
  stop(): void {}
  getStats(dateFrom, dateTo): any {
    return undefined
  }
  getStatus(): any {
    return { botpress: 'up' }
  }
  getRedisFactory() {
    return undefined
  }
}
