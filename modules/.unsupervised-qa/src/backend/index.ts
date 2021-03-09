import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import fr from '../translations/fr.json'
import { ModuleStatus } from '../typings'
import { makeAPI } from './api'
import buildNativeExtension from './build-native-extension'
import makeMw from './middlewares'
import { Storage } from './storage'

const storagePerBot: { [botId: string]: Storage } = {}
const moduleStatus: ModuleStatus = {
  enabled: false,
  modelLoaded: false
}

const onServerStarted = async (bp: typeof sdk) => {
  bp.logger.warn(
    'You are using botpress module unsupervised-qa. Keep in mind this module is experimental and is subject to breaking changes.'
  )

  const moduleEnabled = await buildNativeExtension(bp.logger)
  moduleStatus.enabled = moduleEnabled
  if (moduleEnabled) {
    // to prevent from blocking server
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    makeMw(storagePerBot, moduleStatus).then(mw => bp.events.registerMiddleware(mw))
  }
}

const onServerReady = async (bp: typeof sdk) => {
  makeAPI(bp.http, bp.logger, storagePerBot, moduleStatus)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  storagePerBot[botId] = new Storage(bp.ghost.forBot(botId))
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  botTemplates: [],
  definition: {
    name: 'unsupervised-qa',
    menuIcon: 'help',
    noInterface: false,
    menuText: 'Unsupervised Q&A',
    fullName: 'Unsupervised Q&A',
    homepage: 'https://botpress.com',
    experimental: true
  },
  translations: {
    en,
    fr
  }
}
export default entryPoint
