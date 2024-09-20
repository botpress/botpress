import { getClient } from 'src/client'
import { mapEvent } from 'src/misc/map-event'
import { parseError } from 'src/misc/utils'
import * as bp from '.botpress'

type Merge<T, U> = Omit<T, keyof U> & U

type EventCreateInput = bp.actions.eventCreate.input.Input
type EventCreateProps = Merge<
  bp.ActionProps['eventCreate'],
  {
    input: Merge<
      EventCreateInput,
      {
        item: Omit<EventCreateInput['item'], 'id'>
      }
    >
  }
>

export const eventCreate = (async (props: EventCreateProps) => {
  const { logger, ctx, input } = props
  try {
    const { item } = input
    const { calendar } = await getClient(ctx.configuration)
    const response = await calendar.events.insert({
      calendarId: ctx.configuration.calendarId,
      requestBody: {
        summary: item.summary,
        description: item.description,
        location: item.location,
        start: {
          // The replaceAll is used to remove the extra quotes from the input created by the studio
          dateTime: item.startDateTime?.replaceAll('"', ''),
        },
        end: {
          // The replaceAll is used to remove the extra quotes from the input created by the studio
          dateTime: item.endDateTime?.replaceAll('"', ''),
        },
      },
    })
    return {
      item: mapEvent(response.data),
    }
  } catch (error) {
    const err = parseError(error)
    logger.forBot().error('Error while creating event ', err.message)
    throw err
  }
}) satisfies bp.IntegrationProps['actions']['eventCreate']
