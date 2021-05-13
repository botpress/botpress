import { TurnContext } from 'botbuilder'
import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TeamsContext } from '../backend/typings'

export class TeamsCommonSender implements ChannelSender<TeamsContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return 0
  }

  get id(): string {
    return TeamsCommonSender.name
  }

  handles(context: TeamsContext): boolean {
    return context.handlers.length > 0
  }

  async send(context: TeamsContext) {
    for (const message of context.messages) {
      await context.client.continueConversation(context.convoRef, async (turnContext: TurnContext) => {
        await turnContext.sendActivity(message)
      })
    }
  }
}
