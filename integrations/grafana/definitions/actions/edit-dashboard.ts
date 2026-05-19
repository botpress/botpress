import { z } from '@botpress/sdk'
import { createDashboardInputSchema } from '../dashboard-schemas'
import { ActionDef } from './types'

export const editDashboard = {
  title: 'Edit Dashboard',
  description:
    'Edit an existing Grafana dashboard. WARNING: providing the "panels" field replaces ALL existing panels.',
  input: {
    schema: z
      .object({
        dashboardUid: z
          .string()
          .min(1, 'Dashboard UID is required')
          .title('Dashboard UID')
          .describe('UID of the dashboard to edit (the "name" field from listDashboards)'),
      })
      .merge(createDashboardInputSchema.omit({ uid: true }).partial()),
  },
  output: { schema: z.object({}) },
} satisfies ActionDef
