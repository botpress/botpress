import { Logger } from 'botpress/sdk'
import { MonitoringConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import os from 'os'
import { RedisClient } from 'redis'

import { TYPES } from '../types'

import { JobService } from './job-service'

/**
 * These methods are exposed outside the class to add minimal overhead when collecting metrics
 * It also avoids possible circular reference (the logger class can't access monitoring service, for example)
 */
let metrics: MonitoringMetrics
let metricCollectionEnabled = false

const resetMetrics = () => {
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

interface CpuStats {
  idle: number
  total: number
}

@injectable()
export class MonitoringService {
  private _redisChannel = 'monitoring'
  private _prevCpuStats: CpuStats
  private _collectionIntervalRef: NodeJS.Timeout | undefined
  private _janitorIntervalRef: NodeJS.Timeout | undefined
  private _dataRetentionPeriod: string | undefined
  private _redisClient: RedisClient | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Monitoring')
    protected logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.JobService) private jobService: JobService
  ) {
    resetMetrics()
    this._prevCpuStats = this._getCpuTimes()
  }

  async start() {
    const config = await this._getMonitoringConfig()
    if (!config || !config.enabled) {
      return
    }

    metricCollectionEnabled = true
    this._redisClient = this.jobService.getRedisClient()
    this._dataRetentionPeriod = config.retentionPeriod

    this._collectionIntervalRef = setInterval(() => this._collectStats(), ms(config.collectionInterval))
    this._janitorIntervalRef = setInterval(() => this._clearOlderStats(), ms(config.janitorInterval))
  }

  stop() {
    if (this._collectionIntervalRef) {
      clearInterval(this._collectionIntervalRef)
      this._collectionIntervalRef = undefined
    }

    if (this._janitorIntervalRef) {
      clearInterval(this._janitorIntervalRef)
      this._janitorIntervalRef = undefined
    }
  }

  async getStats(dateFrom, dateTo) {
    if (!this._redisClient) {
      return undefined
    }

    return Promise.fromCallback(cb => this._redisClient!.zrangebyscore(this._redisChannel, dateFrom, dateTo, cb))
  }

  private async _collectStats(): Promise<void> {
    const stats: MonitoringStats = {
      host: os.hostname(),
      ts: new Date().getTime(),
      cpuUsage: this._getCpuUsage(),
      memUsage: this._getMemoryUsage(),
      uptime: Math.round(process.uptime()),
      metrics
    }

    await this._recordStats(stats)
    resetMetrics()
  }

  private async _getMonitoringConfig(): Promise<MonitoringConfig | undefined> {
    const config = await this.configProvider.getBotpressConfig()
    return config.pro && config.pro.monitoring
  }

  private _getMemoryUsage(): number {
    const free = os.freemem() / (1024 * 1024)
    const total = os.totalmem() / (1024 * 1024)

    return _.round(100 - (free / total) * 100, 2)
  }

  private _getCpuUsage(): number {
    const currentCpuStats = this._getCpuTimes()
    const idleDifference = currentCpuStats.idle - this._prevCpuStats.idle
    const totalDifference = currentCpuStats.total - this._prevCpuStats.total
    this._prevCpuStats = currentCpuStats

    return _.round(100 - (idleDifference / totalDifference) * 100, 2)
  }

  private _getCpuTimes(): CpuStats {
    let idle = 0
    let total = 0

    for (const cpu of os.cpus()) {
      idle += cpu.times.idle
      total += _.sum([..._.values(cpu.times)])
    }

    return { idle, total }
  }

  private async _recordStats(data: any): Promise<void> {
    const key = new Date().getTime()
    await Promise.fromCallback(cb => this._redisClient!.zadd(this._redisChannel, key, JSON.stringify(data), cb))
  }

  private async _clearOlderStats(): Promise<void> {
    const retentionDateLimit = moment()
      .subtract(ms(this._dataRetentionPeriod), 'ms')
      .toDate()
      .getTime()

    await Promise.fromCallback(cb => this._redisClient!.zremrangebyscore(this._redisChannel, 0, retentionDateLimit, cb))
  }
}
