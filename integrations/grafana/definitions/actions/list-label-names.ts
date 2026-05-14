import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listLabelNames = {
  title: 'List Label Names',
  description: 'List all label names available in a Prometheus datasource',
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
