import { z } from '@botpress/sdk'
import { ActionDef } from './types'
import type { GrafanaDashboard } from '../../src/types/GrafanaDashboard'

export const getDashboardDataSchema = z.object({
  dashboard: z.any().optional(),
  meta: z.any().optional(),
}) satisfies z.ZodType<Partial<GrafanaDashboard>>

export const getDashboard = {
  title: 'Get Dashboard',
  description: 'Retrieve metadata and spec of a Grafana dashboard',
  input: {
    schema: z.object({
      dashboardUid: z.string().min(1, 'Dashboard UID is required (use the name field from listDashboards, not the title)'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      data: getDashboardDataSchema.optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
