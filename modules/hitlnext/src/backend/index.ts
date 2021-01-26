import * as sdk from 'botpress/sdk'
import { Dictionary } from 'lodash'

import { MODULE_NAME } from '../constants'
import en from '../translations/en.json'
import fr from '../translations/fr.json'

import api from './api'
import { registerMiddleware, unregisterMiddleware } from './middleware'
import migrate from './migrate'
import upsertAgentRoles from './workspace'

export interface StateType {
  cacheHandoff?: Function
  expireHandoff?: Function
  timeouts?: Dictionary<NodeJS.Timeout>
}

const state: StateType = { timeouts: {} }

const onServerStarted = async (bp: typeof sdk) => {
  await migrate(bp)
  await registerMiddleware(bp, state)
}

const onServerReady = async (bp: typeof sdk) => {
  await upsertAgentRoles(bp)
  await api(bp, state)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot(MODULE_NAME)
  await unregisterMiddleware(bp)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  translations: { en, fr },
  definition: {
    name: MODULE_NAME,
    menuIcon: 'headset',
    menuText: 'HITL Next',
    fullName: 'HITL Next',
    homepage: 'https://botpress.com',
    noInterface: false,
    experimental: true
  }
}

export default entryPoint
