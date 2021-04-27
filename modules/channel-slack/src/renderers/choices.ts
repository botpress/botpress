import { ChannelRenderer } from 'common/channel'
import { SlackContext } from '../backend/typings'

export class SlackChoicesRenderer implements ChannelRenderer<SlackContext> {
  get channel(): string {
    return 'slack'
  }

  get priority(): number {
    return 1
  }

  get id() {
    return SlackChoicesRenderer.name
  }

  handles(context: SlackContext): boolean {
    return context.payload.choices
  }

  render(context: SlackContext) {
    if (context.message.text) {
      context.message.blocks.push({ type: 'section', text: { type: 'mrkdwn', text: context.message.text } })
    }

    context.message.blocks.push({
      type: 'actions',
      elements: context.payload.choices.map((q, idx) => ({
        type: 'button',
        action_id: 'replace_buttons' + idx,
        text: {
          type: 'plain_text',
          text: q.title
        },
        value: q.value.toUpperCase()
      }))
    })
  }
}
