import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listContactPoints = {
  title: 'List Contact Points',
  description: 'List all Grafana contact points',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      data: z
        .array(
          z.object({
            uid: z.string().optional(),
            name: z.string().optional(),
            type: z.string(),
          })
        )
        .optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
