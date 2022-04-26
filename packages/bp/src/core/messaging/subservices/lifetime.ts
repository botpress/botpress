import { MessagingClient, uuid } from '@botpress/messaging-client'
import { Logger, RedisLock } from 'botpress/sdk'
import chalk from 'chalk'
import { ConfigProvider } from 'core/config'
import { JobService } from 'core/distributed'
import ms from 'ms'
import { VError } from 'verror'
import { MessagingEntries, MessagingEntry } from './entries'
import { MessagingInteractor } from './interactor'

export class MessagingLifetime {
  private botIdToClientId: { [botId: string]: uuid } = {}
  private clientIdToBotId: { [clientId: uuid]: string } = {}
  private httpClients: { [botId: string]: MessagingClient } = {}

  constructor(
    private logger: Logger,
    private configProvider: ConfigProvider,
    private jobService: JobService,
    private entries: MessagingEntries,
    private interactor: MessagingInteractor
  ) {}

  getClientId(botId: string) {
    return this.botIdToClientId[botId]
  }

  getBotId(clientId: uuid) {
    return this.clientIdToBotId[clientId]
  }

  getHttpClient(botId: string): MessagingClient {
    return this.httpClients[botId]
  }

  async loadMessagingForBot(botId: string, failsafe: boolean = true) {
    await this.interactor.waitReady()

    const lock = await this.lockMessaging(botId)
    const { clientId, clientToken, config } = await this.loadMessagingEntry(botId)
    await lock.unlock()

    const botConfig = await this.configProvider.getBotConfig(botId)
    const channels = { ...config, ...botConfig.messaging?.channels }

    await this.interactor.client.renameClient(clientId, botId)
    this.clientIdToBotId[clientId] = botId
    this.botIdToClientId[botId] = clientId

    try {
      this.interactor.client.start(clientId, { clientToken })
      const { webhooks } = await this.interactor.client.sync(clientId, {
        channels,
        webhooks: [
          { url: this.interactor.isExternal ? `${process.EXTERNAL_URL}/api/v1/chat/receive` : 'http://dummy.com' }
        ]
      })

      const webhookToken = webhooks[0].token!
      this.interactor.client.start(clientId, { clientToken, webhookToken })
      this.httpClients[botId] = this.interactor.createHttpClientForBot(clientId, clientToken, webhookToken)
    } catch (e) {
      this.logger.attachError(e).error('Failed to configure channels')

      if (!failsafe) {
        throw e
      }
    }

    this.printWebhooks(botId, channels)
  }
  private async lockMessaging(botId: string) {
    let lock: RedisLock | undefined
    do {
      lock = await this.jobService.acquireLock(`load_messaging_${botId}`, ms('5s'))
      await Promise.delay(ms('50ms'))
    } while (!lock)

    return lock
  }
  private async loadMessagingEntry(botId: string): Promise<MessagingEntry> {
    const entry = await this.entries.getByBotId(botId)
    if (entry) {
      this.interactor.client.start(entry.clientId, { clientToken: entry.clientToken })
      const reachable = await this.interactor.client.getClient(entry.clientId)

      if (reachable) {
        return entry
      } else {
        // if the clientId was deleted on remote messaging for some reason, we create a new one
        await this.entries.delete(entry.clientId)
        return this.createMessagingEntry(botId)
      }
    } else {
      return this.createMessagingEntry(botId)
    }
  }
  private async createMessagingEntry(botId: string): Promise<MessagingEntry> {
    const { id, token } = await this.interactor.client.createClient()
    return this.entries.create(botId, id, token)
  }

  async unloadMessagingForBot(botId: string) {
    await this.interactor.waitReady()

    const entry = await this.entries.getByBotId(botId)
    if (!entry) {
      return
    }

    delete this.clientIdToBotId[entry.clientId]
    delete this.botIdToClientId[entry.botId]
    delete this.httpClients[entry.botId]

    await this.interactor.client.sync(entry.clientId, {})
  }

  async reloadMessagingForBot(botId: string) {
    this.logger.forBot(botId).info(`[${botId}] Reloading channels`)
    await this.loadMessagingForBot(botId, false)
    this.logger.forBot(botId).info(`[${botId}] Channels reloaded!`)
  }

  private printWebhooks(botId: string, channels: any) {
    const webhooksSpecialCases = { slack: ['interactive', 'events'], vonage: ['inbound', 'status'] }

    for (const [key, config] of Object.entries<any>(channels || {})) {
      const webhooks = config.version === '1.0.0' ? undefined : webhooksSpecialCases[key]

      for (const webhook of webhooks || [undefined]) {
        this.logger
          .forBot(botId)
          .info(
            `[${botId}] ${chalk.bold(key.charAt(0).toUpperCase() + key.slice(1))} ${
              webhook ? `${webhook} ` : ''
            }webhook ${chalk.dim(
              `${process.EXTERNAL_URL}/api/v1/messaging/webhooks${
                channels[key].version === '1.0.0' ? '/v1' : ''
              }/${botId}/${key}${webhook ? `/${webhook}` : ''}`
            )}`
          )
      }
    }
  }
}
