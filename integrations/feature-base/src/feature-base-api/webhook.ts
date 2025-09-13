import { z } from '@botpress/sdk'
import { postCreated, postUpdated, postDeleted, postVoted } from 'definitions/events/posts'
import { commentCreatedSchema } from './sub-schemas'

export const webhookRequestSchema = z.union([
  postCreated.schema,
  postUpdated.schema,
  postDeleted.schema,
  postVoted.schema,
  commentCreatedSchema,
])
