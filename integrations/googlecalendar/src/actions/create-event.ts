import { getClient } from 'src/client'
import { parseError } from 'src/misc/utils'
import { IntegrationProps } from '../misc/types'

export const createEvent: IntegrationProps['actions']['createEvent'] = async ({ ctx, logger, input }) => {
  try {
    const { calendar } = await getClient(ctx.configuration)
    const response = await calendar.events.insert({
      calendarId: ctx.configuration.calendarId,
      requestBody: {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: {
          // The replaceAll is used to remove the extra quotes from the input created by the studio
          dateTime: input.startDateTime.replaceAll('"', ''),
        },
        end: {
          // The replaceAll is used to remove the extra quotes from the input created by the studio
          dateTime: input.endDateTime.replaceAll('"', ''),
        },
      },
    })

    return {
      eventId: response.data.id || undefined,
    }
  } catch (error) {
    const err = parseError(error)
    logger.forBot().error('Error while creating event ', err.message)
    throw err
  }
}
