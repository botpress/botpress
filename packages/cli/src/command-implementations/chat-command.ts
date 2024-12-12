import * as chat from '@botpress/chat'
import semver from 'semver'
import { ApiClient } from 'src/api'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

export type ChatCommandDefinition = typeof commandDefinitions.chat
export class ChatCommand extends GlobalCommand<ChatCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const botId = this.argv.botId ?? (await this._selectBot(api))
    const { bot } = await api.client.getBot({ id: botId }).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, `Could not fetch bot "${botId}"`)
    })

    const integrationInstances = Object.entries(bot.integrations).map(([integrationId, integrationInstance]) => ({
      id: integrationId,
      instance: integrationInstance,
    }))

    const targetChatVersion = this._getChatApiVersionRange()
    const chatIntegrationInstance = integrationInstances.find(
      (i) => i.instance.name === 'chat' && semver.satisfies(i.instance.version, targetChatVersion)
    )

    if (!chatIntegrationInstance) {
      // TODO: prompt to install it
      throw new errors.BotpressCLIError(
        `Chat integration with version ${targetChatVersion} is not installed in the selected bot`
      )
    }

    const { webhookId } = chatIntegrationInstance.instance
    const chatApiUrl = `${this.argv.chatUrl}/${webhookId}`

    const chatClient = await chat.Client.connect({ apiUrl: chatApiUrl })
    await this._chat(chatClient)
  }

  private _chat = async (client: chat.AuthenticatedClient): Promise<void> => {
    const convLine = this.logger.line()
    convLine.started('Creating a conversation...')
    // TODO: handle cases where the status is 200, but the response payload contains an error
    const { conversation } = await client.createConversation({})
    convLine.success(`Conversation created with id "${conversation.id}"`)

    const listener = await client.listenConversation({
      id: conversation.id,
    })

    listener.on('message_created', (m) => {
      const text = this._renderMessage(m)
      console.info(`[${m.userId}] ${text}`)
    })

    while (true) {
      const text = await this.prompt.text('>> ')
      if (text === undefined) {
        continue
      }

      // TODO: handle exit in a better way
      if (text === 'exit') {
        break
      }

      await client.createMessage({
        conversationId: conversation.id,
        payload: {
          type: 'text',
          text,
        },
      })
    }
  }

  private _renderMessage = (message: chat.Message): string => {
    switch (message.payload.type) {
      case 'audio':
        return message.payload.audioUrl
      case 'card':
        return '<card>' // TODO: implement something better
      case 'carousel':
        return '<carousel>' // TODO: implement something better
      case 'choice':
        return [message.payload.text, ...message.payload.options.map((o) => `  - ${o.label} (${o.value})`)].join('\n')
      case 'dropdown':
        return [message.payload.text, ...message.payload.options.map((o) => `  - ${o.label} (${o.value})`)].join('\n')
      case 'file':
        return message.payload.fileUrl
      case 'image':
        return message.payload.imageUrl
      case 'location':
        return `${message.payload.latitude},${message.payload.longitude} (${message.payload.address})`
      case 'text':
        return message.payload.text
      case 'video':
        return message.payload.videoUrl
      case 'markdown':
        return message.payload.markdown
      default:
        type _assertion = utils.types.AssertNever<typeof message.payload>
        return '<unknown>'
    }
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

  private _getChatApiVersionRange = (): string => {
    const dummyClient = new chat.Client({ apiUrl: '' })
    const targetApiVersion = dummyClient.apiVersion
    const nextMajor = semver.inc(targetApiVersion, 'major')
    return `>=${targetApiVersion} <${nextMajor}`
  }
}
