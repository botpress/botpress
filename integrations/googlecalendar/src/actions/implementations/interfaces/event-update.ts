import { wrapAction } from '../../action-wrapper'

export const eventUpdate = wrapAction(
  { actionName: 'eventUpdate', errorMessageWhenFailed: 'Failed to update calendar event' },
  async ({ googleClient }, { item }) => ({ item: await googleClient.updateEvent({ event: item }) })
)
