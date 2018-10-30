import fs from 'fs'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { SDK } from '.'
import Stats from './stats'
import { UpdateTask } from './task'

export default class Analytics {
  private _knex
  private _stats
  private _task

  constructor(private bp: SDK, private botId: string) {
    this._knex = bp['database']
    this._stats = new Stats(this._knex)
    this._task = new UpdateTask(this.bp, this._getInterval())
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

  public getAnalyticsMetadata() {
    return this._stats.getLastRun().then(ts => {
      const run = moment(new Date(ts))
      const then = moment(new Date()).subtract(30, 'minutes')
      const elasped = moment.duration(then.diff(run)).humanize()
      return { lastUpdated: elasped, size: this._getDBSize() }
    })
  }

  private async _updateData() {
    this.bp.logger.forBot(this.botId).debug('Recompiling analytics')

    const totalUsers = await this._stats.getTotalUsers()
    await this._savePartialData(this.botId, 'totalUsers', totalUsers || 0)

    const activeUsers = await this._stats.getDailyActiveUsers()
    await this._savePartialData(this.botId, 'activeUsers', activeUsers)

    const interactionRanges = await this._stats.getInteractionRanges()
    await this._savePartialData(this.botId, 'interactionsRange', interactionRanges)

    const avgInteractions = await this._stats.getAverageInteractions()
    const nbUsers = await this._stats.getNumberOfUsers()
    await this._savePartialData(this.botId, 'fictiveSpecificMetrics', {
      numberOfInteractionInAverage: avgInteractions,
      numberOfUsersToday: nbUsers.today,
      numberOfUsersYesterday: nbUsers.yesterday,
      numberOfUsersThisWeek: nbUsers.week
    })

    const rentention = await this._stats.usersRetention()
    await this._savePartialData(this.botId, 'retentionHeatMap', rentention)

    const busyHours = await this._stats.getBusyHours()
    await this._savePartialData(this.botId, 'busyHoursHeatMap', busyHours)
    await this._stats.setLastRun()
  }

  public async getChartsGraphData() {
    return {
      loading: false,
      noData: false,
      totalUsersChartData: (await this.bp.kvs.get(this.botId, 'totalUsers')) || [],
      activeUsersChartData: (await this.bp.kvs.get(this.botId, 'activeUsers')) || [],
      genderUsageChartData: (await this.bp.kvs.get(this.botId, 'genderUsage')) || [],
      typicalConversationLengthInADay: (await this.bp.kvs.get(this.botId, 'interactionsRange')) || [],
      specificMetricsForLastDays: (await this.bp.kvs.get(this.botId, 'fictiveSpecificMetrics')) || {},
      retentionHeatMap: (await this.bp.kvs.get(this.botId, 'retentionHeatMap')) || [],
      busyHoursHeatMap: (await this.bp.kvs.get(this.botId, 'busyHoursHeatMap')) || []
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
    // TODO: Might be necessary to fix interval based on db size later on.
    // TODO: Might be necessary to add a property in bot config.
    // return this._getDBSize() < 5 ? ms('5m') : ms('1h')
    return ms('5m')
  }

  private async _savePartialData(botId: string, property, data) {
    await this.bp.kvs.set(botId, property, data)
  }
}
