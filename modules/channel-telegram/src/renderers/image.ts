import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { TelegramContext } from '../backend/typings'

export class TelegramImageRenderer implements ChannelRenderer<TelegramContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TelegramImageRenderer.name
  }

  handles(context: TelegramContext): boolean {
    return !!context.payload.image
  }

  render(context: TelegramContext) {
    const { messages } = context
    const payload = context.payload as sdk.ImageContent

    if (payload.image.toLowerCase().endsWith('.gif')) {
      messages.push({ animation: formatUrl(context.botUrl, payload.image) })
    } else {
      messages.push({ photo: formatUrl(context.botUrl, payload.image) })
    }
  }
}
