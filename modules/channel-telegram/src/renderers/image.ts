import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'

export class TelegramImageRenderer implements sdk.ChannelRenderer<TelegramContext> {
  getChannel(): string {
    return 'telegram'
  }

  getPriority(): number {
    return 0
  }

  getId() {
    return TelegramImageRenderer.name
  }

  async handles(context: TelegramContext): Promise<boolean> {
    return context.event.payload.type === 'image'
  }

  async render(context: TelegramContext): Promise<void> {
    const { messages, args } = context
    const { chatId } = args
    const payload = context.event.payload as sdk.ImageContent

    if (payload.image.toLowerCase().endsWith('.gif')) {
      messages.push({ chatId, animation: payload.image })
    } else {
      messages.push({ chatId, photo: payload.image })
    }
  }
}
