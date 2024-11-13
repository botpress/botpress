import { wrapAction } from '../../action-wrapper'

export const eventList = wrapAction(
  { actionName: 'eventList', errorMessageWhenFailed: 'Failed to list calendar events' },
  async ({ googleClient }, { nextToken }) => {
    const { events, nextPageToken } = await googleClient.listEvents({
      fetchAmount: 100,
      minDate: new Date().toISOString(),
      pageToken: nextToken,
    })
    return { items: events, meta: { nextToken: nextPageToken } }
  }
)
