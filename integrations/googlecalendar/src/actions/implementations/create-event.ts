import { wrapAction } from '../action-wrapper'

export const createEvent = wrapAction(
  { actionName: 'createEvent', errorMessageWhenFailed: 'Failed to create calendar event' },
  async ({ googleClient }, event) => await googleClient.createEvent({ event })
)
