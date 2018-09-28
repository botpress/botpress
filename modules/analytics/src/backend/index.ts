import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import Analytics from './analytics'
import CustomAnalytics from './custom-analytics'
import AnalyticsDb from './db'
import setup from './setup'

let analytics = undefined
let db = undefined

export type Extension = {
  analytics: {
    custom: {
      getAll: Function
    }
  }
}

export type SDK = typeof sdk & Extension

const interactionsToTrack = ['message', 'text', 'button', 'template', 'quick_reply', 'postback']

export const onInit = async (bp: SDK) => {
  db = new AnalyticsDb(bp)
  await db.initializeDb()

  bp.analytics = {
    custom: CustomAnalytics({ bp })
  }

  setup(bp, db, interactionsToTrack)

  analytics = new Analytics(bp)
}

export const onReady = (bp: SDK) => {
  const router = bp.http.createRouterForBot('botpress-analytics')

  router.get('/graphs', (req, res, next) => {
    res.send(analytics.getChartsGraphData())
  })

  router.get('/metadata', (req, res, next) => {
    analytics.getAnalyticsMetadata().then(metadata => res.send(metadata))
  })

  router.get('/custom_metrics', async (req, res, next) => {
    const metrics = await bp.analytics.custom.getAll(req.query.from, req.query.to)
    res.send(metrics)
  })
}

export const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(__dirname, '../web/web.bundle.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return new Buffer('')
}
