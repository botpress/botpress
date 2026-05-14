import { z } from '@botpress/sdk'
import { ActionDef } from './types'
import { createDashboardInputSchema } from '../dashboard-schemas'

export const createDashboardOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
})

export const createDashboard = {
  title: 'Create Dashboard',
  description: 'Create a new Grafana dashboard',
  input: {
    schema: createDashboardInputSchema,
  },
  output: {
    schema: createDashboardOutputSchema,
  },
} satisfies ActionDef
