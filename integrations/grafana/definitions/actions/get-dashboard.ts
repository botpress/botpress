import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const getDashboard = {
  title: 'Get Dashboard',
  description: 'Retrieve metadata and spec of a Grafana dashboard',
  input: {
    schema: z.object({
      dashboardUid: z
        .string()
        .min(1, 'Dashboard UID is required')
        .title('Dashboard UID')
        .describe('UID of the dashboard to retrieve (the "name" field from listDashboards, not the title)'),
    }),
  },
  output: {
    schema: z.object({
      dashboard: z
        .any()
        .title('Dashboard')
        .describe('Dashboard specification including all panels, variables, and settings'),
      meta: z.any().title('Metadata').describe('Dashboard metadata including folder UID'),
    }),
  },
} satisfies ActionDef
