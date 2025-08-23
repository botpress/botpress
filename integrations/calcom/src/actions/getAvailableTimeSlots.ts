import { TIntegration } from '.botpress'
import { Input } from '.botpress/implementation/typings/actions/getAvailableTimeSlots/input'
import { ActionHandlerProps } from '@botpress/sdk/dist/integration'
import { CalcomApi } from 'src/calcom.api'

export async function getAvailableTimeSlots(props: ActionHandlerProps<TIntegration, 'getAvailableTimeSlots', Input>) {
  const { ctx, logger, input } = props

  const calcom = new CalcomApi(ctx.configuration.calcomApiKey, logger.forBot())
  const startDate = input.startDate ? new Date(input.startDate) : new Date()
  const endDate = input.endDate ? new Date(input.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) // Default to next 7 days
  const timeSlots = await calcom.getAvailableTimeSlots(input.eventTypeId, startDate, endDate)

  logger.forBot().info('calcom::getAvailableTimeSlots', timeSlots)

  return {
    slots: timeSlots || {},
  }
}
