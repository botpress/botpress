import * as sdk from 'botpress/sdk'
import { SlackContext } from '../backend/typings'

export class SlackFeedbackRenderer implements sdk.ChannelRenderer<SlackContext> {
  getChannel(): string {
    return 'slack'
  }

  getPriority(): number {
    return 1
  }

  getId() {
    return SlackFeedbackRenderer.name
  }

  async handles(context: SlackContext): Promise<boolean> {
    return context.payload.collectFeedback
  }

  async render(context: SlackContext): Promise<void> {
    context.message.blocks.push({
      type: 'section',
      block_id: `feedback-${context.event.incomingEventId}`,
      text: { type: 'mrkdwn', text: context.payload.text },
      accessory: {
        type: 'overflow',
        options: [
          {
            text: {
              type: 'plain_text',
              text: '👍'
            },
            value: '1'
          },
          {
            text: {
              type: 'plain_text',
              text: '👎'
            },
            value: '-1'
          }
        ],
        action_id: 'feedback-overflow'
      }
    })
  }
}
