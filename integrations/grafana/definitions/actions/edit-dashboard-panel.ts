import { z } from '@botpress/sdk'
import { panelSchema } from '../dashboard-schemas'
import { ActionDef } from './types'

export const editDashboardPanel = {
  title: 'Edit Dashboard Panel',
  description:
    'Edit a single panel in a Grafana dashboard by its numeric panel ID. Merges the provided fields into the existing panel without touching other panels.',
  input: {
    schema: z.object({
      dashboardUid: z
        .string()
        .min(1, 'Dashboard UID is required')
        .title('Dashboard UID')
        .describe('UID of the dashboard containing the panel (the "name" field from listDashboards)'),
      panelId: z
        .number()
        .int()
        .title('Panel ID')
        .describe('Numeric ID of the panel to edit (visible in Grafana panel JSON or from getDashboard)'),
      panel: panelSchema.title('Panel').describe('Panel fields to update — merged into the existing panel'),
    }),
  },
  output: { schema: z.object({}) },
} satisfies ActionDef
