import { ActionHandlerProps } from '@botpress/sdk/dist/integration'
import { CalcomApi, CalcomEventType } from 'src/calcom.api'
import { TIntegration } from '.botpress'
import { Input } from '.botpress/implementation/typings/actions/getEventTypes/input'

export async function getEventTypes(props: ActionHandlerProps<TIntegration, 'getEventTypes', Input>) {
  const { ctx, logger, input } = props

  const calcom = new CalcomApi(ctx.configuration.calcomApiKey, logger.forBot())
  const eventTypes = await calcom.getAllEventTypes(input.username)

  return {
    eventTypes: eventTypes
      .map((et) => ({
        id: et.id,
        lengthInMinutes: et.lengthInMinutes,
        title: et.title,
        slug: et.slug,
        description: et.description,
        lengthInMinutesOptions: et.lengthInMinutesOptions ?? [],
      })),
  }
}
