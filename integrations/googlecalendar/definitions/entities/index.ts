import * as sdk from '@botpress/sdk'

import { Event } from './event'
export { Event }

export const entities = {
  event: {
    title: 'Google Calendar Event',
    description: 'An event in a Google Calendar',
    schema: Event.schema,
  },
} as const satisfies sdk.IntegrationDefinitionProps['entities']
