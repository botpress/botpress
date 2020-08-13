import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { ScopedBots } from './qna'
import Storage from './storage'

export const initBot = async (bp: typeof sdk, botId: string, bots: ScopedBots) => {
  const config = await bp.config.getModuleConfigForBot('qna', botId)
  const defaultLang = (await bp.bots.getBotById(botId)).defaultLanguage
  const storage = new Storage(bp.ghost.forBot(botId))
  bots[botId] = { storage, config, defaultLang }
}
