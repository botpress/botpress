import { ActionHandlerProps } from '@botpress/sdk/dist/integration'
import { CalcomApi } from 'src/calcom.api'
import { TIntegration } from '.botpress'
import { Input } from '.botpress/implementation/typings/actions/bookEvent/input'

export async function bookEvent(props: ActionHandlerProps<TIntegration, 'bookEvent', Input>) {
  const { input, logger, ctx } = props

  const calcom = new CalcomApi(ctx.configuration.calcomApiKey, logger.forBot())

  const { start, email, name, eventTypeId, timeZone } = input
  if (!email || !name || !eventTypeId) {
    throw new Error('Email, Name and Event Type ID are required to book an event.')
  }

  const success = await calcom.bookEvent(eventTypeId, start, email, name, timeZone)

  return { success }
}
