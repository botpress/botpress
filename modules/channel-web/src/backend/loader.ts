import * as sdk from 'botpress/sdk'
import ms from 'ms'

import { Config } from '../config'

import Database from './db'

export default class Loader {
  constructor(private bp: typeof sdk, private db: Database) {}

  async load(userId, botId, convId): Promise<any> {
    const userP = this.bp.users.getOrCreateUser('web', userId, botId)
    const moduleConfigP = this.bp.config.getModuleConfig('channel-web') as Promise<Config>
    const moduleConfigBotP = this.bp.config.getModuleConfigForBot('channel-web', botId) as Promise<Config>
    const botConfigP = this.bp.bots.getBotById(botId)

    const [user, moduleConfig, moduleConfigBot, botConfig] = await Promise.all([
      userP,
      moduleConfigP,
      moduleConfigBotP,
      botConfigP
    ])

    const conversations = await this.db.listConversations(userId, botId)

    let shouldCreate = false
    if (conversations.length === 0) {
      shouldCreate = true
    } else {
      const lifeTimeMargin = Date.now() - ms(moduleConfigBot.recentConversationLifetime)
      const isConversationExpired = new Date(conversations[0].last_heard_on).getTime() < lifeTimeMargin
      shouldCreate = isConversationExpired && moduleConfigBot.startNewConvoOnTimeout
    }

    if (shouldCreate) {
      convId = await this.db.createConversation(botId, userId)
    } else if (!convId) {
      convId = conversations[0].id
    }

    const conversation = await this.db.getConversation(userId, convId, botId)

    return {
      fetchBotInfo: {
        showBotInfoPage:
          (moduleConfigBot.infoPage && moduleConfigBot.infoPage.enabled) || moduleConfigBot.showBotInfoPage,
        name: botConfig.name,
        description: (moduleConfigBot.infoPage && moduleConfigBot.infoPage.description) || botConfig.description,
        details: botConfig.details,
        languages: botConfig.languages,
        security: moduleConfig.security
      },
      fetchConversations: {
        conversations: [...conversations],
        startNewConvoOnTimeout: moduleConfigBot.startNewConvoOnTimeout,
        recentConversationLifetime: moduleConfigBot.recentConversationLifetime
      },
      fetchConversation: conversation,
      fetchPreferences: { language: user.result.attributes.language }
    }
  }
}
