import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listLabelValues = {
  title: 'List Label Values',
  description: 'List all values for a specific label in a Prometheus datasource',
  input: {
    schema: z.object({
      datasourceUid: z
        .string()
        .min(1, 'Datasource UID is required')
        .title('Datasource UID')
        .describe('UID of the Prometheus datasource to query'),
      labelName: z
        .string()
        .min(1, 'Label name is required')
        .title('Label Name')
        .describe('Label name to list values for (e.g. "job", "instance")'),
    }),
  },
  output: {
    schema: z.object({
      labelValues: z.array(z.string()).title('Label Values').describe('List of all values for the specified label'),
    }),
  },
} satisfies ActionDef
