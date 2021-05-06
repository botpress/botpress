import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { SlackContext } from '../backend/typings'

export class SlackChoicesRenderer implements ChannelRenderer<SlackContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 1
  }

  get id(): string {
    return SlackChoicesRenderer.name
  }

  handles(context: SlackContext): boolean {
    return !!context.payload.choices?.length
  }

  render(context: SlackContext) {
    if (context.message.text) {
      context.message.blocks.push({ type: 'section', text: { type: 'mrkdwn', text: context.message.text } })
    }

    context.message.blocks.push({
      type: 'actions',
      elements: context.payload.choices.map((q, idx) => ({
        type: 'button',
        action_id: `replace_buttons${idx}`,
        text: {
          type: 'plain_text',
          text: q.title
        },
        value: q.value.toUpperCase()
      }))
    })
  }
}
