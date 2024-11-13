/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { TriggerSchema, EventSchema, ZapierTriggersStateName, ZapierTriggersStateSchema } from './src/types'

export default new IntegrationDefinition({
  name: 'zapier',
  version: '0.3.4',
  title: 'Zapier',
  description:
    "Trigger workflows from Zapier or let Zapier trigger your workflows to automate tasks and enhance your bot's capabilities.",
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
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
