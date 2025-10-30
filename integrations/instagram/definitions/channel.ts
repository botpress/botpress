import { z } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

const commentIdSchema = z.object({
  commentId: z
    .string()
    .optional()
    .title('Comment ID')
    .describe('The Instagram comment ID under which the direct message conversation was started'),
})

export const dmChannelMessages = {
  text: { schema: sdk.messages.defaults.text.schema.merge(commentIdSchema) },
  image: { schema: sdk.messages.defaults.image.schema.merge(commentIdSchema) },
  audio: { schema: sdk.messages.defaults.audio.schema.merge(commentIdSchema) },
  video: { schema: sdk.messages.defaults.video.schema.merge(commentIdSchema) },
  file: { schema: sdk.messages.defaults.file.schema.merge(commentIdSchema) },
  location: { schema: sdk.messages.defaults.location.schema.merge(commentIdSchema) },
  carousel: { schema: sdk.messages.defaults.carousel.schema.merge(commentIdSchema) },
  card: { schema: sdk.messages.defaults.card.schema.merge(commentIdSchema) },
  dropdown: { schema: sdk.messages.defaults.dropdown.schema.merge(commentIdSchema) },
  choice: { schema: sdk.messages.defaults.choice.schema.merge(commentIdSchema) },
  bloc: { schema: sdk.messages.defaults.bloc.schema.merge(commentIdSchema) },
} as const satisfies typeof sdk.messages.defaults

type ValueOf<T> = T[keyof T]
type DmMessageDefinition = ValueOf<typeof dmChannelMessages>
type DmMessage = sdk.z.infer<DmMessageDefinition['schema']>
type AssertMessageTypeHasCommentId<_T extends z.infer<typeof commentIdSchema>> = true
type _AssertMessageTypesHaveCommentId = AssertMessageTypeHasCommentId<DmMessage>
