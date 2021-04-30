import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TelegramContext } from '../backend/typings'

export class TelegramTextRenderer implements ChannelRenderer<TelegramContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TelegramTextRenderer.name
  }

  handles(context: TelegramContext): boolean {
    return !!context.payload.text
  }

  render(context: TelegramContext) {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ text: payload.text as string, markdown: payload.markdown })
  }
}
