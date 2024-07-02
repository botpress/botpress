import { getClient } from 'src/client'
import { mapEvent } from 'src/misc/map-event'
import { parseError } from 'src/misc/utils'
import * as bp from '.botpress'

export const eventUpdate: bp.IntegrationProps['actions']['eventUpdate'] = async (props) => {
  const { logger, ctx, input } = props
  try {
    const { calendar } = await getClient(ctx.configuration)

    const { data } = await calendar.events.patch({
      calendarId: ctx.configuration.calendarId,
      eventId: input.id,
      requestBody: {
        ...input,
      },
    })

    return {
      item: mapEvent(data),
    }
  } catch (error) {
    const err = parseError(error)
    logger.forBot().error('Error while updating event ', err.message)
    throw err
  }
}
