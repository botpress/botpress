import { getClient } from 'src/client'
import { mapEvent } from 'src/misc/map-event'
import { parseError } from 'src/misc/utils'
import * as bp from '.botpress'

export const eventRead: bp.IntegrationProps['actions']['eventRead'] = async (props) => {
  const { logger, ctx, input } = props
  try {
    const { calendar } = await getClient(ctx.configuration)
    const response = await calendar.events.get({
      eventId: input.id,
    })
    return {
      item: mapEvent(response.data),
    }
  } catch (error) {
    const err = parseError(error)
    logger.forBot().error('Error while reading event ', err.message)
    throw err
  }
}
