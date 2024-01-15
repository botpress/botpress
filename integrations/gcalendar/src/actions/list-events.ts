import { getClient } from 'src/client'
import { listEventsOutputSchema } from 'src/misc/custom-schemas'
import { parseError } from 'src/misc/utils'
import { Implementation } from '../misc/types'

export const listEvents: Implementation['actions']['listEvents'] = async ({ logger, ctx, input }) => {
  try {
    const { calendar } = await getClient(ctx.configuration)
    logger.forBot().debug('Listing events', input)
    const response = await calendar.events.list({
      calendarId: ctx.configuration.calendarId,
      maxResults: input.count,
    })

    logger.forBot().debug('List events response', response.data)

    return listEventsOutputSchema.parse({
      events:
        response.data.items?.map((e) => ({
          eventId: e.id,
          event: {
            summary: e.summary,
            description: e.description,
            location: e.location,
            startDateTime: e.start?.dateTime,
            endDateTime: e.end?.dateTime,
          },
        })) ?? [],
    })
  } catch (error) {
    const err = parseError(error)
    logger.forBot().error('Error while listing events ', err.message)
    throw err
  }
}
