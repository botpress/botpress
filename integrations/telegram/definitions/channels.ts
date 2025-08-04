import { z, messages } from '@botpress/sdk'

const _textMessageDefinition = {
  ...messages.defaults.text,
  schema: messages.defaults.text.schema.extend({
    text: messages.defaults.text.schema.shape.text.max(4096),
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
  z.object({ type: z.literal('image'), payload: messages.defaults.image.schema }),
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
  audio: _audioMessageDefinition,
  bloc: _blocMessageDefinition,
}
