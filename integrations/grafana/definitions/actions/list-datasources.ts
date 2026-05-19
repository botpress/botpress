import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listDatasources = {
  title: 'List Datasources',
  description: 'List all Grafana datasources',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      datasources: z
        .array(
          z.object({
            uid: z.string().optional().title('UID').describe('Datasource UID — use this for metric queries'),
            name: z.string().optional().title('Name').describe('Datasource display name'),
            type: z.string().optional().title('Type').describe('Datasource type (e.g. "prometheus", "loki")'),
            isDefault: z.boolean().optional().title('Is Default').describe('Whether this is the default datasource'),
          })
        )
        .title('Datasources')
        .describe('List of all datasources'),
    }),
  },
} satisfies ActionDef
