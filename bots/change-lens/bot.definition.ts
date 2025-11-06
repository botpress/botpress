import { BotDefinition } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

export default new BotDefinition({
  states: { metaApiVersions: { type: 'bot', schema: sdk.z.object({ graphApiVersion: sdk.z.string() }) } },
  events: {
    customEvent: {
      schema: sdk.z.object({}),
    },
  },
  recurringEvents: {
    custom: {
      type: 'customEvent',
      schedule: { cron: '0 * * * *' },
      payload: sdk.z.object({}),
    },
  },
})
