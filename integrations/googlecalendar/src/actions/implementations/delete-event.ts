import { wrapAction } from '../action-wrapper'

export const deleteEvent = wrapAction(
  { actionName: 'deleteEvent', errorMessageWhenFailed: 'Failed to delete calendar event' },
  async ({ googleClient }, { eventId }) => await googleClient.deleteEvent({ eventId })
)
