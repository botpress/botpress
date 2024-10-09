import { z } from '@botpress/sdk'
import * as schemas from './schemas'

export type ImageModel = z.infer<typeof schemas.ImageModelSchema>
export type ImageModelDetails = Omit<ImageModel, 'id'>
