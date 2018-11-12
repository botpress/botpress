import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import api from './api'
import { QnaStorage, SDK } from './qna'
import { initBot, initModule } from './setup'

const botScopedStorage: Map<string, QnaStorage> = new Map<string, QnaStorage>()

const onServerStarted = async (bp: SDK) => {
  await initModule(bp, botScopedStorage)
}

const onServerReady = async (bp: SDK) => {
  await api(bp, botScopedStorage)
}

const onBotMount = async (bp: SDK, botId: string) => {
  await initBot(bp, botScopedStorage, botId)
}

const onBotUnmount = async (bp: SDK, botId: string) => {
  botScopedStorage.delete(botId)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'qna',
    menuIcon: 'question_answer',
    menuText: 'Q&A',
    fullName: 'QNA',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
