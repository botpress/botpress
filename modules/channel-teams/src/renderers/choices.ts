import { CardFactory } from 'botbuilder'
import * as sdk from 'botpress/sdk'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TeamsContext } from '../backend/typings'

export class TeamsChoicesRenderer implements ChannelRenderer<TeamsContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 1
  }

  get id(): string {
    return TeamsChoicesRenderer.name
  }

  handles(context: TeamsContext): boolean {
    return !!(context.payload.choices?.length && context.messages.length > 0)
  }

  render(context: TeamsContext) {
    const payload = context.payload as sdk.ChoiceContent
    const message = context.messages[0]

    message.attachments = [
      CardFactory.heroCard(
        '',
        CardFactory.images([]),
        CardFactory.actions(
          payload.choices.map(reply => {
            return {
              title: reply.title as string,
              type: 'messageBack',
              value: { value: reply.value, renderer: 'choices' },
              text: reply.value,
              displayText: reply.title as string
            }
          })
        )
      )
    ]
  }
}
