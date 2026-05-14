import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const deleteContactPoint = {
  title: 'Delete Contact Point',
  description: 'Delete a Grafana contact point by UID',
  input: {
    schema: z.object({
      uid: z.string().min(1, 'Contact point UID is required'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
