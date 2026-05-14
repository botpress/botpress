import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const createFolderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  uid: z.string().optional(),
  parentUid: z.string().optional(),
  description: z.string().optional(),
})

export const createFolder = {
  title: 'Create Folder',
  description: 'Create a new Grafana folder',
  input: {
    schema: createFolderSchema,
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      uid: z.string().optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
