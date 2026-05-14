import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const deleteDashboard = {
  title: 'Delete Dashboard',
  description: 'Delete a Grafana dashboard',
  input: {
    schema: z.object({
      dashboardName: z.string().min(1, 'Dashboard name is required'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
