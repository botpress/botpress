import * as sdk from '@botpress/sdk'
import { textSchema } from './text-input-schema'
import * as bp from '.botpress'

// NOTE: hardcoded to satisfy typescript linting
export const messagePayloadTypesSchema = sdk.z.enum([
  'text',
  'image',
  'audio',
  'video',
  'file',
  'location',
  'carousel',
  'card',
  'dropdown',
  'choice',
  'bloc',
])

export const messagePayloadSchemas = {
  text: textSchema,
  image: sdk.messages.defaults.image.schema,
  audio: sdk.messages.defaults.audio.schema,
  video: sdk.messages.defaults.video.schema,
  file: sdk.messages.defaults.file.schema,
  location: sdk.messages.defaults.location.schema,
  carousel: sdk.messages.defaults.carousel.schema,
  card: sdk.messages.defaults.card.schema,
  dropdown: sdk.messages.defaults.dropdown.schema,
  choice: sdk.messages.defaults.choice.schema,
  bloc: sdk.messages.defaults.bloc.schema,
}

export const messagePayloadSchema = sdk.z.union([
  textSchema,
  sdk.messages.defaults.image.schema,
  sdk.messages.defaults.audio.schema,
  sdk.messages.defaults.video.schema,
  sdk.messages.defaults.file.schema,
  sdk.messages.defaults.location.schema,
  sdk.messages.defaults.carousel.schema,
  sdk.messages.defaults.card.schema,
  sdk.messages.defaults.dropdown.schema,
  sdk.messages.defaults.choice.schema,
  sdk.messages.defaults.bloc.schema,
])

export const messageSchema = sdk.object({
  type: messagePayloadTypesSchema.title('Type').describe('The type of the message'),
  userId: sdk.z.string().title('User ID').describe('The ID of the user who sent the message'),
  payload: messagePayloadSchema,
  tags: sdk.z.record(sdk.z.string()).optional(),
})

export type MessagePayloadType = sdk.z.infer<typeof messagePayloadTypesSchema>
export type MessagePayload = sdk.z.infer<typeof messagePayloadSchema>
export type Message = sdk.z.infer<typeof messageSchema>
export type Mention = NonNullable<sdk.z.infer<typeof textSchema>['mentions']>[number]
export type MessageTag = keyof bp.ClientRequests['getOrCreateMessage']['tags']
