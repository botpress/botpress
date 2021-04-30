import { ChannelSender } from 'common/channel'
import { SlackContext } from 'src/backend/typings'
import { CHANNEL_NAME } from '../backend/constants'

export class SlackCommonSender implements ChannelSender<SlackContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return SlackCommonSender.name
  }

  handles(context: SlackContext): boolean {
    return context.handlers.length > 0
  }

  async send(context: SlackContext) {
    await context.client.web.chat.postMessage({ channel: context.channelId, text: undefined, ...context.message })
  }
}
