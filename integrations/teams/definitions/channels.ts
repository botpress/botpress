import { IntegrationDefinitionProps, messages, z } from '@botpress/sdk'

// Remove the override once we remove the "markdown" message type from bloc items default in the sdk
const _blocSchema = z.union([
  z.object({ type: z.literal('text'), payload: messages.defaults.text.schema }),
  z.object({ type: z.literal('image'), payload: messages.defaults.image.schema }),
  z.object({ type: z.literal('audio'), payload: messages.defaults.audio.schema }),
  z.object({ type: z.literal('video'), payload: messages.defaults.video.schema }),
  z.object({ type: z.literal('file'), payload: messages.defaults.file.schema }),
  z.object({ type: z.literal('location'), payload: messages.defaults.location.schema }),
])

const _blocMessageDefinition = {
  ...messages.defaults.bloc,
  schema: z.object({
    items: z.array(_blocSchema),
  }),
}

export const channels = {
  channel: {
    title: 'Channel',
    description: 'Teams conversation channel',
    messages: {
      ...messages.defaults,
      bloc: _blocMessageDefinition,
    },
    message: {
      tags: {
        id: {
          title: 'ID',
          description: 'Teams activity ID',
        },
      },
    },
    conversation: {
      tags: {
        id: {
          title: 'ID',
          description: 'Teams conversation ID',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
