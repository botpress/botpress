import sync from './sync'
import * as bp from '.botpress'

export const updateEvent: bp.IntegrationProps['actions']['updateEvent'] = async (props) => {
  const { client, ctx, input, logger } = props
  const output = await sync.eventUpdate({
    type: 'eventUpdate',
    client,
    ctx,
    logger,
    input: {
      id: input.eventId,
      item: {
        id: input.eventId,
        description: input.description ?? undefined,
        summary: input.summary,
        location: input.location ?? undefined,
        startDateTime: input.startDateTime,
        endDateTime: input.endDateTime,
      },
    },
  })
  return {
    eventId: output.item.id,
  }
}
