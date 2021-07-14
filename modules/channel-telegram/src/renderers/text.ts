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

    // parse_mode documented here: https://core.telegram.org/bots/api#markdown-style
    // "Markdown" was chosen over "MarkdownV2" since it's close to original markdown
    // Note: Telegram doesn't support the entire Markdown spec, see link for more details
    context.messages.push({
      text: payload.text as string,
      markdown: payload.markdown,
      extra: payload.markdown ? { parse_mode: 'Markdown' } : {}
    })
  }
}
