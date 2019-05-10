import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import api from './api'

import { Testing } from './testing'
import { TestByBot } from './typings'

const testByBot: TestByBot = {}

const onServerStarted = async (bp: typeof sdk) => {}
const onServerReady = async (bp: typeof sdk) => {
  await api(bp, testByBot)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  testByBot[botId] = new Testing(bp, botId)
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  delete testByBot[botId]
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('testing')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'testing',
    menuIcon: 'polymer',
    menuText: 'Testing',
    noInterface: false,
    fullName: 'Testing',
    homepage: 'https://botpress.io',
    experimental: true
  }
}

export default entryPoint
