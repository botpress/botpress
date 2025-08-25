import { TIntegration } from '.botpress'
import { Input } from '.botpress/implementation/typings/actions/getEventTypes/input'
import { ActionHandlerProps } from '@botpress/sdk/dist/integration'
import { CalcomApi } from 'src/calcom.api'

export async function getEventTypes(props: ActionHandlerProps<TIntegration, 'getEventTypes', Input>) {
  const { ctx, logger, input } = props

  const calcom = new CalcomApi(ctx.configuration.calcomApiKey, logger.forBot())
  const eventTypes = await calcom.getAllEventTypes(input.username)

  return {
    eventTypes: eventTypes
      .filter((et) => !et.hidden)
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
