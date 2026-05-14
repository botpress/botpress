import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listMetricNames = {
  title: 'List Metric Names',
  description: 'List all available metric names in a Prometheus datasource',
  input: {
    schema: z.object({
      datasourceUid: z.string().min(1, 'Datasource UID is required'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      data: z.array(z.string()).optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
