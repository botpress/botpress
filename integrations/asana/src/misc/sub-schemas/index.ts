import { z } from '@botpress/sdk'

const workspaceSchema = z.object({
  gid: z.string().describe('The GID of the workspace').title('GID'),
  name: z.string().describe('The name of the workspace').title('Name'),
  resource_type: z.string().describe('The resource type of the workspace').title('Resource Type'),
})

const photoSchema = z
  .object({
    image_21x21: z.string().describe('An Image 21 by 21').title('Image 21x21'),
    image_27x27: z.string().describe('An Image 27 by 27').title('Image 27x27'),
    image_36x36: z.string().describe('An Image 36 by 36').title('Image 36x36'),
    image_60x60: z.string().describe('An Image 60 by 60').title('Image 60x60'),
    image_128x128: z.string().describe('An Image 128 by 128').title('Image 128x128'),
  })
  .nullable()

export { workspaceSchema, photoSchema }
