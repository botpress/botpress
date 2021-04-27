import * as sdk from 'botpress/sdk'
import { SlackContext } from 'src/backend/typings'

export class SlackCommonSender implements sdk.ChannelSender<SlackContext> {
  get channel(): string {
    return 'slack'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return SlackCommonSender.name
  }

  handles(context: SlackContext): boolean {
    return context.handlers?.length > 0
  }

  async send(context: SlackContext) {
    await context.client.web.chat.postMessage({ channel: context.channelId, text: undefined, ...context.message })
  }
}
