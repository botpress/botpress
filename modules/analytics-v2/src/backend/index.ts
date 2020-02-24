import * as sdk from 'botpress/sdk'

import AnalyticsApi from './api'
import { AnalyticsDatabase } from './db'
import AnalyticsService from './job'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {
  const db = new AnalyticsDatabase(bp.database)
  AnalyticsApi(bp, db)
  const job = new AnalyticsService(bp, db)
  await job.initialize()

  process.BOTPRESS_EVENTS.on('core.analytics', async args => {
    bp.logger.debug('Receiving analytic event', args)
    await Promise.mapSeries(args, arg => job.addMetric(arg as sdk.MetricDefinition))
  })

  job.start()
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'analytics-v2',
    menuIcon: 'timeline',
    menuText: 'Analytics',
    noInterface: false,
    fullName: 'Analytics',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
