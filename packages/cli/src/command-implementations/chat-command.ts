import * as chat from '@botpress/chat'
import * as client from '@botpress/client'
import semver from 'semver'
import { ApiClient } from '../api'
import { Chat } from '../chat'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

type IntegrationInstance = {
  id: string
  instance: client.Bot['integrations'][string]
}

export type ChatCommandDefinition = typeof commandDefinitions.chat
export class ChatCommand extends GlobalCommand<ChatCommandDefinition> {
  public async run(): Promise<void> {
    if (process.platform === 'win32') {
      this.logger.warn('The chat command was not tested on Windows and may not work as expected')
    }

    const api = await this.ensureLoginAndCreateClient(this.argv)
    const botId = this.argv.botId ?? (await this._selectBot(api))
    const { bot } = await api.client.getBot({ id: botId }).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, `Could not fetch bot "${botId}"`)
    })

    const targetChatVersion = this._getChatApiTargetVersionRange()
    let chatIntegrationInstance = this._findChatInstance(bot)

    if (!chatIntegrationInstance) {
      this.logger.log(`Chat integration with version ${targetChatVersion} is not installed in the selected bot`)
      const confirmInstall = await this.prompt.confirm('Do you wish to install it now?')
      if (!confirmInstall) {
        throw new errors.BotpressCLIError('Chat integration is required to proceed')
      }
      chatIntegrationInstance = await this._installChatIntegration(api, botId)
    }

    const { webhookId } = chatIntegrationInstance.instance
    const chatApiBaseUrl = this._getChatApiUrl(api)
    this.logger.debug(`using chat api url: "${chatApiBaseUrl}"`)

    const chatApiUrl = `${chatApiBaseUrl}/${webhookId}`
    const chatClient = await chat.Client.connect({ apiUrl: chatApiUrl })
    await this._chat(chatClient)
  }

  private _chat = async (client: chat.AuthenticatedClient): Promise<void> => {
    const convLine = this.logger.line()
    convLine.started('Creating a conversation...')
    const { conversation } = await client.createConversation({})
    convLine.success(`Conversation created with id "${conversation.id}"`)
    convLine.commit()

    const chat = Chat.launch({ client, conversationId: conversation.id })
    await chat.wait()
  }

  private _getChatApiUrl = (api: ApiClient): string => {
    if (this.argv.chatApiUrl) {
      return this.argv.chatApiUrl
    }

    const parseResult = utils.url.parse(api.url)
    if (parseResult.status === 'error') {
      return consts.defaultChatApiUrl
    }

    const { host, ...url } = parseResult.url
    if (!host.startsWith('api.')) {
      return consts.defaultChatApiUrl
    }

    const newHost = host.replace('api.', 'chat.')
    return utils.url.format({ ...url, host: newHost })
  }

  private _selectBot = async (api: ApiClient): Promise<string> => {
    const availableBots = await api
      .listAllPages(api.client.listBots, (r) => r.bots)
      .catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, 'Could not fetch existing bots')
      })

    if (!availableBots.length) {
      throw new errors.NoBotsFoundError()
    }

    const prompted = await this.prompt.select('Which bot do you want to deploy?', {
      choices: availableBots.map((bot) => ({ title: bot.name, value: bot.id })),
    })

    if (!prompted) {
      throw new errors.ParamRequiredError('Bot Id')
    }

    return prompted
  }

  private _installChatIntegration = async (api: ApiClient, botId: string): Promise<IntegrationInstance> => {
    const line = this.logger.line()
    line.started('Installing chat integration...')

    const { integration } = await api.client.getPublicIntegration({
      name: 'chat',
      version: this._getChatApiTargetVersion(),
    })

    const { bot } = await api.client.updateBot({
      id: botId,
      integrations: {
        [integration.id]: {
          enabled: true,
          configuration: {}, // empty object will always be a valid chat integration configuration
        },
      },
    })

    line.success('Chat integration installed')
    line.commit()

    return this._findChatInstance(bot)!
  }

  private _findChatInstance = (bot: client.Bot): IntegrationInstance | undefined => {
    const integrationInstances = Object.entries(bot.integrations).map(([integrationId, integrationInstance]) => ({
      id: integrationId,
      instance: integrationInstance,
    }))

    const targetChatVersion = this._getChatApiTargetVersionRange()
    return integrationInstances.find(
      (i) => i.instance.name === 'chat' && semver.satisfies(i.instance.version, targetChatVersion)
    )
  }

  private _getChatApiTargetVersionRange = (): string => {
    const targetApiVersion = this._getChatApiTargetVersion()
    const nextMajor = semver.inc(targetApiVersion, 'major')
    return `>=${targetApiVersion} <${nextMajor}`
  }

  private _getChatApiTargetVersion = (): string => {
    const dummyClient = new chat.Client({ apiUrl: '' })
    return dummyClient.apiVersion
  }
}
