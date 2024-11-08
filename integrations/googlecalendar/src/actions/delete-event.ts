import sync from './sync'
import * as bp from '.botpress'

export const deleteEvent: bp.IntegrationProps['actions']['deleteEvent'] = async (props) => {
  const { client, ctx, input, logger, metadata } = props
  const { eventId } = input

  if (!eventId) {
    return { eventId }
  }

  await sync.eventDelete({
    type: 'eventDelete',
    client,
    ctx,
    logger,
    metadata,
    input: {
      id: eventId,
    },
  })
  return {
    eventId,
  }
}
