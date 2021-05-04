import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { SlackContext } from '../backend/typings'

export class SlackFeedbackRenderer implements ChannelRenderer<SlackContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 1
  }

  get id(): string {
    return SlackFeedbackRenderer.name
  }

  handles(context: SlackContext): boolean {
    return !!context.payload.collectFeedback
  }

  render(context: SlackContext) {
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
