import _ from 'lodash'
import ms from 'ms'

export enum Metric {
  Requests = 'requests.count',
  EventsIn = 'eventsIn.count',
  EventsOut = 'eventsOut.count',
  Warnings = 'warnings.count',
  Errors = 'errors.count',
  Criticals = 'criticals.count'
}

const AVG_KEYS = ['cpu.usage', 'mem.usage']
const SUM_KEYS = [Metric.Requests, Metric.Errors, Metric.Criticals, Metric.Warnings, Metric.EventsIn, Metric.EventsOut]

/**
 * This object groups all statistics entries by their 'resolution group'. For example, if the resolution is 30 seconds,
 * the timeFrame will contain all monitoring stats from the first entry timestamp + 30s
 */
interface MonitoringGroupInterval {
  [timeFrame: number]: MonitoringStats[]
}

/**
 * This objects represents the summary for every metrics (be it global average or total of metrics)
 * and also returns an average value for each unique hosts (there could be multiple measurements per hosts per interval)
 */
interface IntervalSummary {
  ts: number
  summary: Partial<MonitoringStats>
  hosts: {
    [hostName: string]: Partial<MonitoringStats>
  }
}

export const groupEntriesByTime = (entries: MonitoringStats[], timeInterval: string) => {
  if (!entries || !entries.length) {
    return
  }

  const timeInMs = ms(timeInterval)
  let groupTime = entries[0].ts

  return _.groupBy(entries, entry => {
    return entry.ts - groupTime <= timeInMs ? groupTime : (groupTime = entry.ts)
  }) as MonitoringGroupInterval
}

export const mergeEntriesByTime = (groupedEntries: MonitoringGroupInterval, uniqueHosts: string[]) => {
  return _.values(
    _.mapValues(groupedEntries, (entries, ts) => {
      return calculateAverageAndSum(entries, ts, uniqueHosts)
    })
  )
}

const calculateAverageAndSum = (allEntries: MonitoringStats[], ts: string, uniqueHosts: string[]): IntervalSummary => {
  const hosts = {}
  const summary = {}

  for (const host of uniqueHosts) {
    hosts[host] = hosts[host] || {}
    const hostEntries = _.filter(allEntries, entry => entry.uniqueId === host)
    AVG_KEYS.forEach(key => {
      const sum = _.sumBy(hostEntries, key)

      _.set(hosts[host], key, _.round(sum / hostEntries.length, 2))
      _.set(summary, key, _.get(summary, key, 0) + sum)
    })

    SUM_KEYS.forEach(key => {
      const sum = _.sumBy(hostEntries, key)

      _.set(hosts[host], key, sum)
      _.set(summary, key, _.get(summary, key, 0) + sum)
    })
  }

  AVG_KEYS.forEach(key => _.set(summary, key, _.round(_.get(summary, key) / allEntries.length, 2)))

  return {
    ts: +ts,
    hosts,
    summary
  }
}

export const calculateOverviewForHost = (hostStats: MonitoringStats[]) => {
  const overview: Partial<MonitoringStats> = {}

  AVG_KEYS.forEach(key => _.set(overview, key, _.get(_.maxBy(hostStats, key), key)))
  SUM_KEYS.forEach(key => _.set(overview, key, _.sumBy(hostStats, key)))

  return overview
}

export type MonitoringStats = MonitoringMetrics & {
  // Auto-generated from host and server id
  uniqueId?: string
  host: string
  serverId: string
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
  criticals: { count: number }
}
