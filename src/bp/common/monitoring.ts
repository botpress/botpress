import { MonitoringStats } from 'core/services/monitoring'
import _ from 'lodash'
import ms from 'ms'

const keysToAverage = ['cpu.usage', 'mem.usage']
const keyToSum = ['requests.count', 'errors.count', 'warnings.count', 'eventsIn.count', 'eventsOut.count']

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

const calculateAverageAndSum = (allEntries: MonitoringStats[], ts: string, uniqueHosts: string[]) => {
  const result: IntervalSummary = {
    ts: +ts,
    hosts: {},
    summary: {}
  }

  for (const host of uniqueHosts) {
    const currentHost = (result.hosts[host] = {})
    const hostEntries = _.filter(allEntries, entry => entry.host === host)

    keysToAverage.forEach(key => _.set(currentHost, key, _.round(_.sumBy(hostEntries, key) / hostEntries.length, 2)))
    keyToSum.forEach(key => _.set(currentHost, key, _.sumBy(hostEntries, key)))
  }

  keysToAverage.forEach(key => _.set(result.summary, key, _.round(_.sumBy(allEntries, key) / allEntries.length, 2)))
  keyToSum.forEach(key => _.set(result.summary, key, _.sumBy(allEntries, key)))

  return result
}

export const calculateOverviewForHost = (hostStats: MonitoringStats[]) => {
  const overview: Partial<MonitoringStats> = {}

  keysToAverage.forEach(key => _.set(overview, key, _.get(_.maxBy(hostStats, key), key)))
  keyToSum.forEach(key => _.set(overview, key, _.sumBy(hostStats, key)))

  return overview
}
