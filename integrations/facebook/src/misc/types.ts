import { z } from '@botpress/sdk'
import * as bp from '.botpress'

export type MetaClientConfigType = bp.Context['configurationType'] | 'oauth'

export type MetaClientCredentials = {
  userToken?: string
  pageToken?: string
  pageId?: string
  clientId: string
  clientSecret?: string
  appToken?: string
}

export type FacebookClientCredentials = {
  pageId: string
  pageToken: string
}

export type CommentReply = {
  message: string
  commentId: string
}

export type PostReply = {
  message: string
  postId: string
}

// Comment event schemas
const commentChangeValueSchema = z.object({
  item: z.string(),
  verb: z.string(),
  created_time: z.number(),
  comment_id: z.string(),
  post_id: z.string(),
  parent_id: z.string(),
  message: z.string().optional(),
  from: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
})

// Feed event schemas
const feedChangeValueSchema = z.object({
  item: z.string(),
  verb: z.string(),
  created_time: z.number(),
  post_id: z.string(),
  comment_id: z.string().optional(),
  parent_id: z.string().optional(),
  message: z.string().optional(),
  from: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  parent: z
    .object({
      id: z.string(),
      message: z.string().optional(),
    })
    .optional(),
})

const feedChangeSchema = z.object({
  field: z.string(),
  value: z.union([feedChangeValueSchema, commentChangeValueSchema]),
})

const feedEventEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  changes: z.array(feedChangeSchema),
})

export const feedEventPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(feedEventEntrySchema),
})

export type FeedChangeValue = z.infer<typeof feedChangeValueSchema>
export type CommentChangeValue = z.infer<typeof commentChangeValueSchema>
export type FeedChange = z.infer<typeof feedChangeSchema>
export type FeedEventEntry = z.infer<typeof feedEventEntrySchema>
export type FeedEventPayload = z.infer<typeof feedEventPayloadSchema>
