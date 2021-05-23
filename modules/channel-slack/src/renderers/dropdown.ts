import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { SlackContext } from '../backend/typings'

export class SlackDropdownRenderer implements ChannelRenderer<SlackContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return SlackDropdownRenderer.name
  }

  handles(context: SlackContext): boolean {
    return !!context.payload.options?.length
  }

  render(context: SlackContext) {
    const payload = context.payload // as sdk.DropdownContent

    context.message.blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'static_select',
          action_id: 'option_selected',
          placeholder: {
            type: 'plain_text',
            text: payload.message
          },
          options: payload.options.map(q => ({
            text: {
              type: 'plain_text',
              text: q.label
            },
            value: q.value
          }))
        }
      ]
    })
  }
}
