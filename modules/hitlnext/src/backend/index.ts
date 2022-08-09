import * as sdk from 'botpress/sdk'
import { Dictionary } from 'lodash'

import { MODULE_NAME } from '../constants'
import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

import api from './api'
import flowBuilder from './flowBuilder'
import { registerMiddleware, unregisterMiddleware } from './middleware'
import migrate from './migrate'
import Repository from './repository'
import upsertAgentRoles from './workspace'

export interface StateType {
  cacheHandoff?: Function
  expireHandoff?: Function
  timeouts?: Dictionary<NodeJS.Timeout>
}

const state: StateType = { timeouts: {} }
let repository: Repository

const onServerStarted = async (bp: typeof sdk) => {
  await migrate(bp)
  await registerMiddleware(bp, state)
}

const onServerReady = async (bp: typeof sdk) => {
  await upsertAgentRoles(bp)
  repository = new Repository(bp, state.timeouts)
  await api(bp, state, repository)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot(MODULE_NAME)
  await unregisterMiddleware(bp)
}

const skills: sdk.Skill[] = [
  {
    id: 'HitlNext',
    icon: 'person',
    name: 'HITL',
    flowGenerator: flowBuilder.generateFlow
  }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  translations: { en, fr, es },
  skills,
  definition: {
    name: MODULE_NAME,
    menuIcon: 'headset',
    menuText: 'HITL Next',
    fullName: 'HITL Next',
    homepage: 'https://botpress.com',
    noInterface: false,
    experimental: false,
    workspaceApp: { bots: true }
  }
}

export default entryPoint
