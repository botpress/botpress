import { wrapAction } from '../action-wrapper'

export const listEvents = wrapAction(
  { actionName: 'listEvents', errorMessageWhenFailed: 'Failed to list calendar events' },
  async ({ googleClient }, { count, pageToken, timeMin }) =>
    await googleClient.listEvents({
      fetchAmount: count ?? 100,
      minDate: timeMin ?? new Date().toISOString(),
      pageToken,
    })
)
