import sync from './sync'
import * as bp from '.botpress'

export const createEvent: bp.IntegrationProps['actions']['createEvent'] = async (props) => {
  const { client, ctx, input, logger, metadata } = props
  const output = await sync.eventCreate({
    type: 'eventCreate',
    client,
    ctx,
    logger,
    metadata,
    input: {
      item: {
        description: input.description ?? undefined,
        summary: input.summary,
        location: input.location ?? undefined,
        startDateTime: input.startDateTime,
        endDateTime: input.endDateTime,
        attendees: input.attendees,
        conferenceData: input.conferenceData,
      },
      sendUpdates: input.sendUpdates,
    },
  })
  return {
    eventId: output.item.id,
  }
}
