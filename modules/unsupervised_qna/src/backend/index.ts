import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import API from './api'
import buildNativeExtension from './build-native-extension'
import makeMw from './middlewares'
import { Storage } from './storage'

const storagePerBot: { [botId: string]: Storage } = {}

const onServerStarted = async (bp: typeof sdk) => {
  bp.logger.warn(
    'You are using botpress module unsupervised_qna. Keep in mind this module is experimental and is subject to breaking changes.'
  )

  await buildNativeExtension()

  const mw = makeMw(storagePerBot)

  bp.events.registerMiddleware(mw)
}

const onServerReady = async (bp: typeof sdk) => {
  await API(bp.http, bp.logger, storagePerBot)
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
    name: 'unsupervised_qna',
    menuIcon: 'help',
    noInterface: false,
    menuText: 'Unsupervised Q&A',
    fullName: 'Unsupervised Q&A',
    homepage: 'https://botpress.com',
    experimental: true
  },
  translations: {
    en
  }
}
export default entryPoint
