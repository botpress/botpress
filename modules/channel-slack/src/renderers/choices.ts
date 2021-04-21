import * as sdk from 'botpress/sdk'
import { SlackContext } from '../backend/typings'

export class SlackChoicesRenderer implements sdk.ChannelRenderer<SlackContext> {
  getChannel(): string {
    return 'slack'
  }

  getPriority(): number {
    return 1
  }

  getId() {
    return SlackChoicesRenderer.name
  }

  async handles(context: SlackContext): Promise<boolean> {
    return context.event.payload.choices
  }

  async render(context: SlackContext): Promise<void> {
    if (context.message.text) {
      context.message.blocks.push({ type: 'section', text: { type: 'mrkdwn', text: context.message.text } })
    }

    context.message.blocks.push({
      type: 'actions',
      elements: context.event.payload.choices.map((q, idx) => ({
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
