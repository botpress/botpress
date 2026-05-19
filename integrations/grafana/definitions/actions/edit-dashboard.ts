import { z } from '@botpress/sdk'
import { ActionDef } from './types'
import { createDashboardInputSchema } from '../dashboard-schemas'

export const editDashboard = {
  title: 'Edit Dashboard',
  description:
    'Edit an existing Grafana dashboard. WARNING: providing the "panels" field replaces ALL existing panels.',
  input: {
    schema: z
      .object({
        dashboardUid: z.string().min(1, 'Dashboard UID is required'),
      })
      .merge(createDashboardInputSchema.omit({ uid: true }).partial()),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
