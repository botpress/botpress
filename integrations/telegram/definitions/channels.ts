import { z, messages } from '@botpress/sdk'

const _textMessageDefinition = {
  ...messages.defaults.text,
  schema: messages.defaults.text.schema.extend({
    text: messages.defaults.text.schema.shape.text
      .max(4096)
      .describe('The text content of the Telegram message (Limit 4096 characters)'),
  }),
}

const _imageMessageDefinition = {
  ...messages.defaults.image,
  schema: messages.defaults.image.schema.extend({
    caption: z.string().optional().describe('The caption/description of the image'),
  }),
}

const _audioMessageDefinition = {
  ...messages.defaults.audio,
  schema: messages.defaults.audio.schema.extend({
    caption: z.string().optional().describe('The caption/transcription of the audio message'),
  }),
}

const _blocSchema = z.union([
  z.object({ type: z.literal('text'), payload: _textMessageDefinition.schema }),
  z.object({ type: z.literal('image'), payload: _imageMessageDefinition.schema }),
  z.object({ type: z.literal('audio'), payload: _audioMessageDefinition.schema }),
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

export const telegramMessageChannels = {
  ...messages.defaults,
  text: _textMessageDefinition,
  image: _imageMessageDefinition,
  audio: _audioMessageDefinition,
  bloc: _blocMessageDefinition,
}
