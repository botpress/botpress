import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { ScopedBots } from './qna'
import Storage from './storage'
import StorageLegacy from './storage_legacy'

export const initBot = async (bp: typeof sdk, botId: string, bots: ScopedBots) => {
  const config = await bp.config.getModuleConfigForBot('qna', botId)
  const botConfig = await bp.bots.getBotById(botId)
  const defaultLang = (await bp.bots.getBotById(botId)).defaultLanguage

  let storage
  if (botConfig.oneflow) {
    storage = new Storage(bp.ghost.forBot(botId))
  } else {
    storage = new StorageLegacy(bp.ghost.forBot(botId))
  }

  bots[botId] = { storage, config, defaultLang, isLegacy: !botConfig.oneflow }
}
