import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

import api from './api'
import Database from './db'
import setup from './setup'

let db: Database

const interactionsToTrack = ['message', 'text', 'button', 'template', 'quick_reply', 'postback']

const onServerStarted = async (bp: typeof sdk) => {
  db = new Database(bp)
  await setup(bp, db, interactionsToTrack)
}

const onServerReady = async (bp: typeof sdk) => {
  api(bp, db)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('analytics.incoming')
  bp.events.removeMiddleware('analytics.outgoing')
  bp.http.deleteRouterForBot('analytics')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  translations: { en, fr, es },
  definition: {
    name: 'analytics',
    fullName: 'Analytics',
    homepage: 'https://botpress.com',
    menuIcon: 'timeline-line-chart',
    menuText: 'Analytics',
    workspaceApp: { bots: true }
  }
}

export default entryPoint
