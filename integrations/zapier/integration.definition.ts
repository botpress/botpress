import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'
import { TriggerSchema, EventSchema, ZapierTriggersStateName, ZapierTriggersStateSchema } from './src/types'

export default new IntegrationDefinition({
  name: 'zapier',
  version: '0.2.0',
  title: 'Zapier',
  description: 'This integration allows your bot to interact with Zapier.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({}),
  },
  channels: {},
  user: {
    tags: {
      id: {},
    },
  },
  states: {
    [ZapierTriggersStateName]: {
      type: 'integration',
      schema: ZapierTriggersStateSchema,
    },
  },
  events: {
    event: {
      title: 'Event from Zapier',
      description: 'This is called when a Zap sends an event to the Zapier webhook of your bot.',
      schema: EventSchema,
      ui: { data: { title: 'Event Data received from Zapier', examples: ['{ "message": "Hello Botpress!" }'] } },
    },
  },
  actions: {
    trigger: {
      title: 'Send to Zapier',
      description: 'This sends a trigger to Zapier which you can use to start a Zap.',
      input: {
        schema: TriggerSchema,
        ui: { data: { title: 'Trigger Data to send to Zapier', examples: ['{ "message": "Hello Zapier!" }'] } },
      },
      output: {
        schema: z.object({}),
      },
    },
  },
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
