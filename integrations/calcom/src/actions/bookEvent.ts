import { TIntegration } from '.botpress'
import { Input } from '.botpress/implementation/typings/actions/bookEvent/input'
import { ActionHandlerProps } from '@botpress/sdk/dist/integration'
import { CalcomApi } from 'src/calcom.api'

export async function bookEvent(props: ActionHandlerProps<TIntegration, 'bookEvent', Input>) {
  const { input, logger, ctx, client } = props

  const calcom = new CalcomApi(ctx.configuration.calcomApiKey, logger.forBot())

  const { start, email, name, eventTypeId, timeZone } = input
  if (!email || !name || !eventTypeId) {
    throw new Error('Email, Name and Event Type ID are required to book an event.')
  }

  const success = await calcom.bookEvent(eventTypeId, start, email, name, timeZone)

  if (success && input.conversationId) {
    await client.createEvent({
      conversationId: input.conversationId,
      type: 'eventScheduled',
      payload: {
        event: 'booked_from_bot',
      },
    })
  }

  return { success }
}
