import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listLabelNames = {
  title: 'List Label Names',
  description: 'List all label names available in a Prometheus datasource',
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
      labelNames: z.array(z.string()).title('Label Names').describe('List of all label names in the datasource'),
    }),
  },
} satisfies ActionDef
