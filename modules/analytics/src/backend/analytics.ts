import { SDK } from 'botpress'
import fs from 'fs'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import CustomAnalytics from './custom-analytics'
import Stats from './stats'
import { UpdateTask } from './task'
import { CustomAnalytics as CustomAnalyticsType } from './typings'

export default class Analytics {
  private _knex
  private _stats
  private _task
  public custom: CustomAnalyticsType

  constructor(private bp: SDK, private botId: string) {
    this._knex = bp['database']
    this._stats = new Stats(this._knex)
    this._task = new UpdateTask(this.bp, this._getInterval())
    this.custom = CustomAnalytics({ bp, botId })
  }

  public async start() {
    this._task.runTask = async () => {
      await this._updateData()
    }

    await this._task.start(this.botId)
  }

  public async stop() {
    await this._task.stop(this.botId)
  }

  public async getAnalyticsMetadata() {
    const timestamp = await this._stats.getLastRun()
    const lastRun = moment(timestamp)
    const elasped = moment.duration(moment().diff(lastRun)).humanize()
    return { lastUpdated: elasped, size: this._getDBSize() }
  }

  private async _updateData() {
    const totalUsers = await this._stats.getTotalUsers()
    const activeUsers = await this._stats.getDailyActiveUsers()
    const interactionsRange = await this._stats.getInteractionRanges()
    const avgInteractions = await this._stats.getAverageInteractions()
    const nbUsers = await this._stats.getNumberOfUsers()
    const rentention = await this._stats.usersRetention()
    const busyHours = await this._stats.getBusyHours()

    await this._savePartialData(this.botId, 'analytics', {
      totalUsers: totalUsers || 0,
      activeUsers,
      interactionsRange: interactionsRange,
      fictiveSpecificMetrics: {
        numberOfInteractionInAverage: avgInteractions,
        numberOfUsersToday: nbUsers.today,
        numberOfUsersYesterday: nbUsers.yesterday,
        numberOfUsersThisWeek: nbUsers.week
      },
      retentionHeatMap: rentention,
      busyHoursHeatMap: busyHours
    })
    await this._stats.setLastRun()
  }

  public async getChartsGraphData() {
    const analytics = await this.bp.kvs.get(this.botId, 'analytics')

    if (!analytics) {
      return {}
    }

    return {
      loading: false,
      noData: false,
      totalUsersChartData: analytics['totalUsers'] || [],
      activeUsersChartData: analytics['activeUsers'] || [],
      genderUsageChartData: analytics['genderUsage'] || [],
      typicalConversationLengthInADay: analytics['interactionsRange'] || [],
      specificMetricsForLastDays: analytics['fictiveSpecificMetrics'] || {},
      retentionHeatMap: analytics['retentionHeatMap'] || [],
      busyHoursHeatMap: analytics['busyHoursHeatMap'] || []
    }
  }

  private _getDBSize() {
    if (this.bp.database.isLite) {
      return fs.statSync(this.bp.database.location)['size'] / 1000000.0 // in megabytes
    } else {
      return 1
    }
  }

  private _getInterval() {
    return this._getDBSize() < 5 ? ms('5m') : ms('1h')
  }

  private async _savePartialData(botId: string, property, data) {
    await this.bp.kvs.set(botId, property, data)
  }
}
