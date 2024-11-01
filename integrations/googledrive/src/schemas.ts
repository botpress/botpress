import { z } from '@botpress/sdk'

export const fileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().min(1).optional(),
})

export const fileCreateArgSchema = fileSchema.omit({
  id: true,
})

export const folderSchema = fileSchema
