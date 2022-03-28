import { MessagingChannel, MessagingClient } from '@botpress/messaging-client'
import { AxiosRequestConfig } from 'axios'
import { Logger } from 'botpress/sdk'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import yn from 'yn'

export class MessagingInteractor {
  public readonly client: MessagingChannel
  public readonly isExternal: boolean

  private channelNames = ['messenger', 'slack', 'smooch', 'teams', 'telegram', 'twilio', 'vonage']

  constructor(private logger: Logger) {
    this.client = new MessagingChannel({ url: this.getMessagingUrl() })
    this.isExternal = Boolean(process.core_env.MESSAGING_ENDPOINT)
  }

  public async setup() {
    this.client.options = this.getOptions()

    // use this to test converse from messaging
    if (yn(process.env.ENABLE_EXPERIMENTAL_CONVERSE)) {
      this.channelNames.push('messaging')
    }
  }

  public async postSetup() {
    await this.waitReady()
    this.client.url = this.getMessagingUrl()
  }

  public async waitReady() {
    if (!this.isExternal) {
      await AppLifecycle.waitFor(AppLifecycleEvents.STUDIO_READY)
    }
  }

  public shouldSkipChannel(channel: string) {
    return !this.channelNames.includes(channel)
  }

  public createHttpClientForBot(clientId: string, clientToken: string, webhookToken: string) {
    return new MessagingClient({
      ...this.getOptions(),
      clientId,
      clientToken,
      webhookToken
    })
  }

  private getOptions() {
    return {
      url: this.getMessagingUrl(),
      axios: this.getAxiosConfig(),
      adminKey: this.isExternal ? process.env.MESSAGING_ADMIN_KEY : process.env.INTERNAL_PASSWORD,
      logger: {
        info: this.logger.info.bind(this.logger),
        debug: this.logger.debug.bind(this.logger),
        warn: this.logger.warn.bind(this.logger),
        error: (e, msg, data) => {
          this.logger.attachError(e).error(msg || '', data)
        }
      }
    }
  }

  private getAxiosConfig(): AxiosRequestConfig {
    const config: AxiosRequestConfig = {}

    if (!this.isExternal) {
      config.proxy = false
      config.headers = { password: process.env.INTERNAL_PASSWORD }
    }

    return config
  }

  private getMessagingUrl() {
    return process.core_env.MESSAGING_ENDPOINT
      ? process.core_env.MESSAGING_ENDPOINT
      : `http://localhost:${process.MESSAGING_PORT}`
  }
}
