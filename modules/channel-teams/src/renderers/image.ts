import { ActivityTypes } from 'botbuilder'
import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { formatUrl } from 'common/url'
import { CHANNEL_NAME } from '../backend/constants'
import { TeamsContext } from '../backend/typings'

export class TeamsImageRenderer implements ChannelRenderer<TeamsContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TeamsImageRenderer.name
  }

  handles(context: TeamsContext): boolean {
    return !!context.payload.image
  }

  render(context: TeamsContext) {
    const payload = context.payload as sdk.ImageContent

    context.messages.push({
      type: ActivityTypes.Message,
      attachments: [
        {
          // TODO: this isn't working (no image caption)
          name: payload.title as string,
          contentType: 'image/png',
          contentUrl: formatUrl(context.botUrl, payload.image)
        }
      ]
    })
  }
}
