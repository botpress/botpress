import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { TelegramContext } from 'src/backend/typings'

export class TelegramTextRenderer implements ChannelRenderer<TelegramContext> {
  get channel(): string {
    return 'telegram'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return TelegramTextRenderer.name
  }

  handles(context: TelegramContext): boolean {
    return context.payload.text
  }

  render(context: TelegramContext) {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ text: payload.text as string, markdown: payload.markdown })
  }
}
