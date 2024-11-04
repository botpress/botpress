import { z } from '@botpress/sdk'

const hasId = z.object({
  id: z.string().min(1),
})
export const fileAttrSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().min(1).optional(),
})
export const fileSchema = hasId.merge(fileAttrSchema)
export const fileCreateArgSchema = fileAttrSchema
export const fileUpdateArgSchema = hasId.merge(fileAttrSchema.partial())

export const folderSchema = fileSchema
