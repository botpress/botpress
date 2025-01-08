import { wrapAction } from '../../action-wrapper'

export const eventRead = wrapAction(
  { actionName: 'eventRead', errorMessageWhenFailed: 'Failed to delete calendar event' },
  async ({ googleClient }, { id }) => ({ item: await googleClient.getEvent({ eventId: id }) })
)
