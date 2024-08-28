import { getClient } from 'src/client'
import { mapEvent } from 'src/misc/map-event'
import { parseError } from 'src/misc/utils'
import * as bp from '.botpress'

const DEFAULT_COUNT = 100
const DEFAULT_TIME_MIN = new Date().toISOString()

type ListEventOptions = {
  count?: number
  timeMin?: string
}

export const eventList = (async (props, opts: ListEventOptions = {}) => {
  const { logger, ctx, input } = props

  const count = opts.count ?? DEFAULT_COUNT
  const timeMin = opts.timeMin ?? DEFAULT_TIME_MIN

  try {
    const { calendar } = await getClient(ctx.configuration)
    logger.forBot().debug('Listing events', input)
    const response = await calendar.events.list({
      calendarId: ctx.configuration.calendarId,
      maxResults: count,
      timeMin,
      pageToken: input.nextToken,
      orderBy: 'startTime',
      singleEvents: true,
    })

    logger.forBot().debug('List events response', response.data)

    const { nextPageToken, items: events } = response.data
    const items = events?.map(mapEvent) ?? []

    return {
      items,
      meta: {
        nextToken: nextPageToken ?? undefined,
      },
    }
  } catch (error) {
    const err = parseError(error)
    logger.forBot().error('Error while listing events ', err.message)
    throw err
  }
}) satisfies bp.IntegrationProps['actions']['eventList']
