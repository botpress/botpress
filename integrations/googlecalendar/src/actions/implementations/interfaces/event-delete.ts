import { wrapAction } from '../../action-wrapper'

export const eventDelete = wrapAction(
  { actionName: 'eventDelete', errorMessageWhenFailed: 'Failed to delete calendar event' },
  async ({ googleClient }, { id }) => await googleClient.deleteEvent({ eventId: id })
)
