import { getClient } from 'src/client'
import { parseError } from 'src/misc/utils'
import { IntegrationProps } from '../misc/types'

export const updateEvent: IntegrationProps['actions']['updateEvent'] = async ({ logger, ctx, input }) => {
  try {
    const { calendar } = await getClient(ctx.configuration)

    await calendar.events.patch({
      calendarId: ctx.configuration.calendarId,
      eventId: input.eventId,
      requestBody: {
        ...input,
      },
    })
    return { success: true }
  } catch (error) {
    const err = parseError(error)
    logger.forBot().error('Error while updating events ', err.message)
    throw err
  }
}
