import { injectable } from 'inversify'
import _ from 'lodash'

/**
 * These methods are exposed outside the class to add minimal overhead when collecting metrics
 * It also avoids possible circular reference (the logger class can't access monitoring service, for example)
 */
let metrics: MonitoringMetrics
let metricCollectionEnabled = false

export const getMetrics = () => {
  return metrics
}

export const setMetricsCollection = enabled => {
  metricCollectionEnabled = enabled
}

export const resetMetrics = () => {
  metrics = {
    requests: 0,
    eventsIn: 0,
    eventsOut: 0,
    warnings: 0,
    errors: 0
  }
}

export const incrementMetric = (metricName: string) => {
  if (!metricCollectionEnabled) {
    return
  }

  if (!metrics[metricName]) {
    metrics[metricName] = 1
  } else {
    metrics[metricName]++
  }
}

export interface MonitoringStats {
  host: string
  ts: number
  cpuUsage: number
  memUsage: number
  uptime: number
  metrics: MonitoringMetrics
}

export interface MonitoringMetrics {
  requests: number
  eventsIn: number
  eventsOut: number
  warnings: number
  errors: number
}

export interface MonitoringService {
  start(): Promise<void>
  stop(): void
  getStats(dateFrom, dateTo): any
}

@injectable()
export class CEMonitoringService implements MonitoringService {
  async start(): Promise<void> {}
  stop(): void {}
  getStats(dateFrom, dateTo): any {
    return undefined
  }
}
