import sync from './sync'
import * as bp from '.botpress'

export const listEvents: bp.IntegrationProps['actions']['listEvents'] = async (props) => {
  const { client, ctx, input, logger } = props

  const output = await sync.eventList(
    {
      type: 'eventList',
      client,
      ctx,
      logger,
      input: {
        nextToken: input.pageToken,
      },
    },
    {
      count: input.count,
      timeMin: input.timeMin,
    }
  )

  type ListEventOutput = bp.actions.listEvents.output.Output
  type EventResponse = ListEventOutput['events'][number]
  const events: ListEventOutput['events'] = output.items.map(
    ({ id, ...item }): EventResponse => ({
      eventId: id,
      event: {
        summary: item.summary ?? '',
        location: item.location,
        description: item.description,
        endDateTime: item.endDateTime ?? new Date().toISOString(),
        startDateTime: item.startDateTime ?? new Date().toISOString(),
      },
    })
  )

  return {
    events,
  }
}
