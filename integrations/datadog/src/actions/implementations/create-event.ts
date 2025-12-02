import { wrapAction } from '../action-wrapper'

export const createEvent = wrapAction(
  { actionName: 'createEvent', errorMessageWhenFailed: 'Failed to create Datadog event' },
  async ({ datadogClient }, event) => await datadogClient.createEvent(event)
)

