import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import api from './api'
import FTWrapper from './fasttext/fasttext.wrapper'
import ScopedNlu from './scopednlu'
import { initBot, initModule } from './setup'

export type SDK = typeof sdk

const botScopedNlu: Map<string, ScopedNlu> = new Map<string, ScopedNlu>()

const onServerStarted = async (bp: SDK) => {
  await initModule(bp, botScopedNlu)

  const config = await bp.config.getModuleConfig('nlu')
  if (config.fastTextPath) {
    FTWrapper.changeBinPath(config.fastTextPath)
  }
}

const onServerReady = async (bp: SDK) => {
  await api(bp, botScopedNlu)
}

const onBotMount = async (bp: SDK, botId: string) => {
  await initBot(bp, botScopedNlu, botId)
}

const onBotUnmount = async (bp: SDK, botId: string) => {
  botScopedNlu.delete(botId)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'nlu',
    moduleView: {
      stretched: true
    },
    menuIcon: 'fiber_smart_record',
    menuText: 'NLU',
    fullName: 'NLU',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
