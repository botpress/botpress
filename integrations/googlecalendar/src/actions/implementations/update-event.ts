import { wrapAction } from '../action-wrapper'

export const updateEvent = wrapAction(
  { actionName: 'updateEvent', errorMessageWhenFailed: 'Failed to update calendar event' },
  async ({ googleClient }, event) => await googleClient.updateEvent({ event })
)
