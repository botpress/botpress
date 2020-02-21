import * as sdk from 'botpress/sdk'

import AnalyticsApi from './api'
import { AnalyticsDatabase } from './db'
import AnalyticsService from './job'

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {
  const db = new AnalyticsDatabase(bp.database)
  AnalyticsApi(db)
  const job = new AnalyticsService(bp, db)
  await job.initialize()

  process.BOTPRESS_EVENTS.on('core.analytics', async (arg: { botId; channel; metric; method }) => job.addMetric(arg))

  job.start()
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'analytics',
    menuIcon: 'timeline',
    menuText: 'Analytics',
    noInterface: false,
    fullName: 'Analytics',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
