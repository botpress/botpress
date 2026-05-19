import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const listFolders = {
  title: 'List Folders',
  description: 'List all Grafana folders',
  input: { schema: z.object({}) },
  output: {
    schema: z.object({
      success: z.boolean(),
      data: z
        .array(
          z.object({
            uid: z.string().optional(),
            title: z.string().optional(),
            parentUid: z.string().optional(),
          })
        )
        .optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
