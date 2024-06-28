import { getClient } from 'src/client'
import { parseError } from 'src/misc/utils'
import * as bp from '.botpress'

export const eventDelete: bp.IntegrationProps['actions']['eventDelete'] = async (props) => {
  const { logger, ctx, input } = props
  try {
    const { calendar } = await getClient(ctx.configuration)

    await calendar.events.delete({ calendarId: ctx.configuration.calendarId, eventId: input.id })

    return {}
  } catch (error) {
    const err = parseError(error)
    logger.forBot().error('Error while deleting event ', err.message)
    throw err
  }
}
