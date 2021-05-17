import { ActivityTypes, CardFactory } from 'botbuilder'
import { ChannelRenderer } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TeamsContext } from '../backend/typings'

export class TeamsDropdownRenderer implements ChannelRenderer<TeamsContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TeamsDropdownRenderer.name
  }

  handles(context: TeamsContext): boolean {
    return context.payload.options?.length > 0
  }

  render(context: TeamsContext) {
    const payload = context.payload // TODO: as sdk.DropdownContent

    context.messages.push({
      type: ActivityTypes.Message,
      attachments: [
        CardFactory.adaptiveCard({
          type: 'AdaptiveCard',
          body: [
            {
              type: 'TextBlock',
              size: 'Medium',
              weight: 'Bolder',
              text: payload.message
            },
            {
              type: 'Input.ChoiceSet',
              choices: payload.options.map((opt, idx) => ({
                title: opt.label,
                id: `choice-${idx}`,
                value: opt.value
              })),
              id: 'text',
              placeholder: 'Select a choice',
              wrap: true
            }
          ],
          actions: [
            {
              type: 'Action.Submit',
              title: payload.buttonText,
              id: 'btnSubmit'
            }
          ],
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          version: '1.2'
        })
      ]
    })
  }
}
