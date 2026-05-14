import { z } from '@botpress/sdk'
import { ActionDef } from './types'
import { panelSchema } from '../dashboard-schemas'

export const editDashboardPanel = {
  title: 'Edit Dashboard Panel',
  description: 'Edit a single panel in a Grafana dashboard by its numeric panel ID. Merges the provided fields into the existing panel without touching other panels.',
  input: {
    schema: z.object({
      dashboardUid: z.string().min(1, 'Dashboard UID is required'),
      panelId: z.number().int().describe('The numeric id of the panel to edit (visible in Grafana panel JSON or from getDashboard)'),
      panel: panelSchema,
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
