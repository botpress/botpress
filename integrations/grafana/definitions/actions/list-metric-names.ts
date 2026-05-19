import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listMetricNames = {
  title: 'List Metric Names',
  description: 'List all available metric names in a Prometheus datasource',
  input: {
    schema: z.object({
      datasourceUid: z
        .string()
        .min(1, 'Datasource UID is required')
        .title('Datasource UID')
        .describe('UID of the Prometheus datasource to query'),
    }),
  },
  output: {
    schema: z.object({
      metricNames: z
        .array(z.string())
        .title('Metric Names')
        .describe('List of all metric names available in the datasource'),
    }),
  },
} satisfies ActionDef
