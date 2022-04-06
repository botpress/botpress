import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

import api from './api'
import { Testing } from './testing'
import { TestByBot } from './typings'

const testByBot: TestByBot = {}

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
  onServerReady,
  onModuleUnmount,
  onBotMount,
  onBotUnmount,
  translations: { en, fr },
  definition: {
    name: 'testing',
    menuIcon: 'record',
    menuText: 'Testing',
    noInterface: false,
    fullName: 'Testing',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
