import { z } from '@botpress/sdk'
import { createDashboardInputSchema } from '../dashboard-schemas'
import { ActionDef } from './types'

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
