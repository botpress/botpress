import * as sdk from 'botpress/sdk'
import { Dictionary } from 'lodash'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

import api from './api'
import { registerMiddleware, unregisterMiddleware } from './middleware'
import migrate from './migrate'
import Workspace from './workspace'

const debug = DEBUG('hitl2')

export interface StateType {
  cacheEscalation?: Function
  expireEscalation?: Function
  timeouts?: Dictionary<NodeJS.Timeout>
}

const state: StateType = { timeouts: {} }

const onServerStarted = async (bp: typeof sdk) => {
  await migrate(bp)
}

const onServerReady = async (bp: typeof sdk) => {
  if (!process.IS_PRO_ENABLED) {
    bp.logger.info('HITL2: module is disabled because it requires Botpress Pro', { module: 'hitl2' })
    return
  }

  const workspace = Workspace(bp)

  await migrate(bp)
  await api(bp, state)
  await workspace
    .insertRole('default', [
      {
        id: 'agent',
        name: 'admin.workspace.roles.default.agent.name',
        description: 'admin.workspace.roles.default.agent.description',
        rules: [
          {
            res: '*',
            op: '+r'
          },
          {
            res: 'module.hitl2',
            op: '+r+w'
          }
        ]
      }
    ])
    .then(() => debug('Updating workspace configuration', { role: 'agent' }))

  await registerMiddleware(bp, state)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('hitl2')
  await unregisterMiddleware(bp)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  translations: { en, fr },
  definition: {
    name: 'hitl2',
    menuIcon: 'headset',
    menuText: 'HITL 2',
    fullName: 'HITL 2',
    homepage: 'https://botpress.com',
    noInterface: false
  }
}

export default entryPoint
