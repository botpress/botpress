import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const deleteDashboard = {
  title: 'Delete Dashboard',
  description: 'Delete a Grafana dashboard',
  input: {
    schema: z.object({
      dashboardName: z
        .string()
        .min(1, 'Dashboard name is required')
        .title('Dashboard Name')
        .describe('UID/name of the dashboard to delete (the "name" field from listDashboards)'),
    }),
  },
  output: { schema: z.object({}) },
} satisfies ActionDef
