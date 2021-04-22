import * as sdk from 'botpress/sdk'
import { SlackContext } from 'src/backend/typings'

export class SlackCommonSender implements sdk.ChannelSender<SlackContext> {
  getChannel(): string {
    return 'slack'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return SlackCommonSender.name
  }

  async handles(context: SlackContext): Promise<boolean> {
    return context.handlers?.length > 0
  }

  async send(context: SlackContext): Promise<void> {
    await context.client.web.chat.postMessage({ channel: context.channelId, text: undefined, ...context.message })
  }
}
