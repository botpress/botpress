import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listLabelValues = {
  title: 'List Label Values',
  description: 'List all values for a specific label in a Prometheus datasource',
  input: {
    schema: z.object({
      datasourceUid: z.string().min(1, 'Datasource UID is required'),
      labelName: z.string().min(1, 'Label name is required (e.g. "job", "instance")'),
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
