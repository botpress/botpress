import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { TwilioContext } from '../backend/typings'

export class TwilioImageRenderer implements ChannelRenderer<TwilioContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TwilioImageRenderer.name
  }

  handles(context: TwilioContext): boolean {
    return !!context.payload.image
  }

  render(context: TwilioContext) {
    const payload = context.payload as sdk.ImageContent

    // TODO fix mediaUrl not being in typings
    context.messages.push(<any>{ body: payload.title as string, mediaUrl: formatUrl(context.botUrl, payload.image) })
  }
}
