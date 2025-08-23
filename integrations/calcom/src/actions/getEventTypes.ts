import { TIntegration } from '.botpress'
import { Input } from '.botpress/implementation/typings/actions/getEventTypes/input'
import { ActionHandlerProps } from '@botpress/sdk/dist/integration'
import { CalcomApi } from 'src/calcom.api'

export async function getEventTypes(props: ActionHandlerProps<TIntegration, 'getEventTypes', Input>) {
  const { ctx, logger } = props

  const calcom = new CalcomApi(ctx.configuration.calcomApiKey, logger.forBot())
  const eventTypes = await calcom.getAllEventTypes()

  logger.forBot().info('calcom::getEventTypes UPDATE', eventTypes)

  return {
    eventTypes: eventTypes
      .filter((et: any) => !et.hidden)
      .map((et: any) => ({
        id: et.id,
        lengthInMinutes: et.lengthInMinutes,
        title: et.title,
        slug: et.slug,
        description: et.description,
        lengthInMinutesOptions: et.lengthInMinutesOptions ?? [],
      })),
  }
}
