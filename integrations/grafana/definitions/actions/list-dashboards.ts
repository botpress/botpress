import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listDashboards = {
  title: 'List Dashboards',
  description: 'List all Grafana dashboards in the namespace',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      dashboards: z
        .array(
          z.object({
            name: z.string().title('Name').describe('Dashboard UID — use this value for other dashboard actions'),
            title: z.string().title('Title').describe('Dashboard display title'),
          })
        )
        .title('Dashboards')
        .describe('List of all dashboards in the namespace'),
    }),
  },
} satisfies ActionDef
