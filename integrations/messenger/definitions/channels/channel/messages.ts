import { z } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

const commentIdSchema = z.object({
  commentId: z
    .string()
    .optional()
    .title('Comment ID')
    .describe('The Messenger ID of the comment from which to initiate the next private-reply discussion'),
})

export const messages = {
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
  bloc: { schema: sdk.messages.markdownBloc.schema.merge(commentIdSchema) },
} as const satisfies Record<string, { schema: z.ZodTypeAny }>

type ValueOf<T> = T[keyof T]
type ChannelMessageDefinition = ValueOf<typeof messages>
type ChannelMessage = sdk.z.infer<ChannelMessageDefinition['schema']>
type AssertMessageTypeHasCommentId<_T extends z.infer<typeof commentIdSchema>> = true
type _AssertMessageTypesHaveCommentId = AssertMessageTypeHasCommentId<ChannelMessage>
