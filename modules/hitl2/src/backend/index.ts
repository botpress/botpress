import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

import { setup, teardown } from './setup'
import api from './api'

interface State {}

let state: State = {}

const onServerStarted = async (bp: typeof sdk) => {}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, state)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  await setup(bp, botId, state)
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  await teardown(bp, botId, state)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  state = undefined
  bp.http.deleteRouterForBot('hitl2')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  translations: { en, fr },
  definition: {
    name: 'hitl2',
    menuIcon: 'chat',
    menuText: 'HITL 2',
    fullName: 'HITL 2',
    homepage: 'https://botpress.com',
    noInterface: false
  }
}

export default entryPoint
