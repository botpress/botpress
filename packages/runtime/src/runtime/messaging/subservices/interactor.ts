import { MessagingChannel, MessagingClient } from '@botpress/messaging-client'
import { Logger } from 'botpress/sdk'
import { CloudMessagingChannel } from '../../cloud/messaging'

export class MessagingInteractor {
  public readonly client: MessagingChannel

  constructor(private logger: Logger) {
    this.client = process.OAUTH_ENDPOINT
      ? new CloudMessagingChannel(this.getOptions())
      : new MessagingChannel(this.getOptions())
  }

  async setup() {
    if (!process.MESSAGING_ENDPOINT) {
      this.logger.warn('No messaging endpoint provided, some features will not work as expected.')
      return
    }
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
      url: process.MESSAGING_ENDPOINT!,
      sessionCookieName: process.MESSAGING_SESSION_COOKIE_NAME,
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
}
