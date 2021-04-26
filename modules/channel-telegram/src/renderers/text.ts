import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'

export class TelegramTextRenderer implements sdk.ChannelRenderer<TelegramContext> {
  get channel(): string {
    return 'telegram'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return TelegramTextRenderer.name
  }

  async handles(context: TelegramContext): Promise<boolean> {
    return context.payload.text
  }

  async render(context: TelegramContext): Promise<void> {
    const payload = context.payload as sdk.TextContent

    context.messages.push({ text: payload.text as string, markdown: payload.markdown })
  }
}
