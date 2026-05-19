import { z } from '@botpress/sdk'
import { createDashboardInputSchema } from '../dashboard-schemas'
import { ActionDef } from './types'

export const createDashboard = {
  title: 'Create Dashboard',
  description: 'Create a new Grafana dashboard',
  input: {
    schema: createDashboardInputSchema,
  },
  output: {
    schema: z.object({}),
  },
} satisfies ActionDef
