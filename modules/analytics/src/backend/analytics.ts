import sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import moment from 'moment'
import path from 'path'

import Stats from './stats'

const createEmptyFileIfDoesntExist = file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '{}')
  }
}

const loadDataFromFile = file => {
  if (!fs.existsSync(file)) {
    sdk.logger.debug(`Analytics file "${file}" doesn't exist.`)
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

export default class Analytics {
  private bp
  private knex
  private stats
  private chartsDatafile
  private running
  private tempChartData: Map<string, object>

  constructor(bp) {
    if (!bp) {
      throw new Error('You need to specify botpress')
    }

    this.bp = bp
    this.knex = bp['database']
    this.stats = new Stats(this.knex)
    this.tempChartData = new Map<string, object>()

    const running = false
    setInterval(() => {
      this.stats.getLastRun().then(ts => {
        const elasped = moment.duration(moment().diff(ts)).asMinutes()
        if (!ts || elasped >= this.getUpdateFrequency()) {
          this.updateData()
        }
      })
    }, 5000)
  }

  getDBSize() {
    if (this.bp.db.location !== 'postgres') {
      return fs.statSync(this.bp.db.location)['size'] / 1000000.0 // in megabytes
    } else {
      return 1
    }
  }

  getAnalyticsMetadata() {
    return this.stats.getLastRun().then(ts => {
      const run = moment(new Date(ts))
      const then = moment(new Date()).subtract(30, 'minutes')
      const elasped = moment.duration(then.diff(run)).humanize()
      return { lastUpdated: elasped, size: this.getDBSize() }
    })
  }

  getUpdateFrequency() {
    return this.getDBSize() < 5 ? 5 : 60
  }

  updateData() {
    if (this.running) {
      return
    }
    this.running = true
    this.bp.logger.debug('recompiling analytics')
    this.stats
      .getTotalUsers()
      .then(data => this.savePartialData('totalUsers', data))
      .then(() => this.stats.getDailyActiveUsers())
      .then(data => this.savePartialData('activeUsers', data))
      // .then(() => this.stats.getDailyGender())
      // .then(data => this.savePartialData('genderUsage', data))
      .then(() => this.stats.getInteractionRanges())
      .then(data => this.savePartialData('interactionsRange', data))
      .then(() => this.stats.getAverageInteractions())
      .then(averageInteractions => {
        this.stats.getNumberOfUsers().then(nbUsers => {
          this.savePartialData('fictiveSpecificMetrics', {
            numberOfInteractionInAverage: averageInteractions,
            numberOfUsersToday: nbUsers.today,
            numberOfUsersYesterday: nbUsers.yesterday,
            numberOfUsersThisWeek: nbUsers.week
          })
        })
      })
      .then(() => this.stats.usersRetention())
      .then(data => this.savePartialData('retentionHeatMap', data))
      .then(() => this.stats.getBusyHours())
      .then(data => this.savePartialData('busyHoursHeatMap', data))
      .then(() => {
        const data = this.getChartsGraphData()
        // TODO alternative
        // this.bp.events.emit('data.send', data)
        this.stats.setLastRun()
      })
      .then(() => (this.running = false))
  }

  savePartialData(property, data) {
    this.tempChartData.set(property, data)

    /*  const chartsData = loadDataFromFile(this.chartsDatafile)
    chartsData[property] = data
    fs.writeFileSync(this.chartsDatafile, JSON.stringify(chartsData))*/
  }

  getChartsGraphData() {
    // const chartsData = loadDataFromFile(this.chartsDatafile)

    /*if (_.isEmpty(chartsData)) {
      return { loading: true, noData: true }
    }*/

    return {
      loading: false,
      noData: false,
      totalUsersChartData: this.tempChartData.get('totalUsers') || [],
      activeUsersChartData: this.tempChartData.get('activeUsers') || [],
      genderUsageChartData: this.tempChartData.get('genderUsage') || [],
      typicalConversationLengthInADay: this.tempChartData.get('interactionsRange') || [],
      specificMetricsForLastDays: this.tempChartData.get('fictiveSpecificMetrics') || {},
      retentionHeatMap: this.tempChartData.get('retentionHeatMap') || [],
      busyHoursHeatMap: this.tempChartData.get('busyHoursHeatMap') || []
    }
    /*return {
      loading: false,
      noData: false,
      totalUsersChartData: chartsData.totalUsers || [],
      activeUsersChartData: chartsData.activeUsers || [],
      genderUsageChartData: chartsData.genderUsage || [],
      typicalConversationLengthInADay: chartsData.interactionsRange || [],
      specificMetricsForLastDays: chartsData.fictiveSpecificMetrics || {},
      retentionHeatMap: chartsData.retentionHeatMap || [],
      busyHoursHeatMap: chartsData.busyHoursHeatMap || []
    }*/
  }
}
