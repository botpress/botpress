import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'

export class TelegramTextRenderer implements sdk.ChannelRenderer<TelegramContext> {
  getChannel(): string {
    return 'telegram'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return TelegramTextRenderer.name
  }

  async handles(context: TelegramContext): Promise<boolean> {
    return context.event.payload.text
  }

  async render(context: TelegramContext): Promise<void> {
    const { event, args, messages } = context
    const { chatId } = args
    const payload = event.payload as sdk.TextContent

    messages.push({ chatId, text: payload.text as string, markdown: payload.markdown })
  }
}
