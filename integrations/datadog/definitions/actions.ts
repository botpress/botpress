import { default as sdk, z } from '@botpress/sdk'
import * as entities from './entities'

export const actions = {
  queryMetrics: {
    title: 'Query Metrics',
    description: 'Query time-series metrics from Datadog.',
    input: {
      schema: z.object({
        query: z
          .string()
          .min(1)
          .title('Query')
          .describe('The metric query to execute (e.g., "avg:system.cpu.user{*}").'),
        from: z
          .number()
          .title('From')
          .describe('Start timestamp in seconds (Unix timestamp).'),
        to: z
          .number()
          .title('To')
          .describe('End timestamp in seconds (Unix timestamp).'),
      }),
    },
    output: {
      schema: entities.MetricQueryResult.schema
        .title('Metric Query Result')
        .describe('The result of the metric query.'),
    },
  },
  createEvent: {
    title: 'Create Event',
    description: 'Creates a new event in Datadog.',
    input: {
      schema: entities.Event.schema
        .omit({ id: true, url: true, dateHappened: true })
        .extend({
          title: z.string().min(1).title('Title').describe('Title of the event.'),
          text: z.string().min(1).title('Text').describe('Text body of the event.'),
        })
        .title('New Event')
        .describe('The definition of the new event.'),
    },
    output: {
      schema: entities.Event.schema.title('Created Event').describe('The data of the newly created event.'),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']

