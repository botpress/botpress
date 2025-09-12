import { z } from '@botpress/sdk'
import { commentCreatedSchema } from './sub-schemas'
import { postCreated, postUpdated, postDeleted, postVoted } from 'definitions/events/posts'

export const webhookRequestSchema = z.union([
  postCreated.schema,
  postUpdated.schema,
  postDeleted.schema,
  postVoted.schema,
  commentCreatedSchema,
])
