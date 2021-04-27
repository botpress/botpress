import * as sdk from 'botpress/sdk'
import { TelegramContext } from 'src/backend/typings'

export class TelegramImageRenderer implements sdk.ChannelRenderer<TelegramContext> {
  get channel(): string {
    return 'telegram'
  }

  get priority(): number {
    return 0
  }

  get id() {
    return TelegramImageRenderer.name
  }

  handles(context: TelegramContext): boolean {
    return context.payload.image
  }

  render(context: TelegramContext) {
    const { messages } = context
    const payload = context.payload as sdk.ImageContent

    if (payload.image.toLowerCase().endsWith('.gif')) {
      messages.push({ animation: payload.image })
    } else {
      messages.push({ photo: payload.image })
    }
  }
}
