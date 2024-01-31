import { getClient } from 'src/client'
import { parseError } from 'src/misc/utils'
import { Implementation } from '../misc/types'

export const deleteEvent: Implementation['actions']['deleteEvent'] = async ({ logger, ctx, input }) => {
  try {
    const { calendar } = await getClient(ctx.configuration)

    await calendar.events.delete({ calendarId: ctx.configuration.calendarId, eventId: input.eventId })

    return { success: true }
  } catch (error) {
    const err = parseError(error)
    logger.forBot().error('Error while deleting event ', err.message)
    throw err
  }
}
