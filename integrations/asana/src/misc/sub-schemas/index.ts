import { z } from '@botpress/sdk'

const workspaceSchema = z.object({
  gid: z.string(),
  name: z.string(),
  resource_type: z.string(),
})

const photoSchema = z
  .object({
    image_21x21: z.string(),
    image_27x27: z.string(),
    image_36x36: z.string(),
    image_60x60: z.string(),
    image_128x128: z.string(),
  })
  .nullable()

export { workspaceSchema, photoSchema }
