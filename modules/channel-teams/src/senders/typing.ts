import { TurnContext } from 'botbuilder'
import { ChannelSender } from 'common/channel'
import { CHANNEL_NAME } from '../backend/constants'
import { TeamsContext } from '../backend/typings'

export class TeamsTypingSender implements ChannelSender<TeamsContext> {
  get channel(): string {
    return CHANNEL_NAME
  }

  get priority(): number {
    return -1
  }

  get id(): string {
    return TeamsTypingSender.name
  }

  handles(context: TeamsContext): boolean {
    const typing = context.event.payload.typing
    return context.handlers.length > 0 && (typing === undefined || typing === true)
  }

  async send(context: TeamsContext) {
    const delay = context.event.payload.delay ?? 1000

    await context.client.continueConversation(context.convoRef, async (turnContext: TurnContext) => {
      await turnContext.sendActivity({ type: 'typing' })
    })

    await Promise.delay(delay)
  }
}
