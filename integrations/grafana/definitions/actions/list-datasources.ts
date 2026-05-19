import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listDatasources = {
  title: 'List Datasources',
  description: 'List all Grafana datasources',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      success: z.boolean(),
      data: z
        .array(
          z.object({
            uid: z.string().optional(),
            name: z.string().optional(),
            type: z.string().optional(),
            isDefault: z.boolean().optional(),
          })
        )
        .optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
