import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listDashboards = {
  title: 'List Dashboards',
  description: 'List all Grafana dashboards in the namespace',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      dashboards: z.array(
        z.object({
          name: z.string(),
          title: z.string(),
        })
      ).optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
