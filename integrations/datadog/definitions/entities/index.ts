import * as sdk from '@botpress/sdk'

import { Event } from './event'
import { MetricQueryResult } from './metric-query-result'

export { Event, MetricQueryResult }

export const entities = {
  event: {
    title: 'Datadog Event',
    description: 'A Datadog event',
    schema: Event.schema,
  },
  metricQueryResult: {
    title: 'Datadog Metric Query Result',
    description: 'Result from a Datadog metric query',
    schema: MetricQueryResult.schema,
  },
} as const satisfies sdk.IntegrationDefinitionProps['entities']

