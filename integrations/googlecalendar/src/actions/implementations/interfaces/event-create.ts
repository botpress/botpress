import { wrapAction } from '../../action-wrapper'

export const eventCreate = wrapAction(
  { actionName: 'eventCreate', errorMessageWhenFailed: 'Failed to create calendar event' },
  async ({ googleClient }, { item }) => ({ item: await googleClient.createEvent({ event: item }) })
)
