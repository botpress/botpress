import { z, messages } from '@botpress/sdk'

const _audioMessageDefinition = {
  ...messages.defaults.audio,
  schema: messages.defaults.audio.schema.extend({
    caption: z.string().optional().describe('The caption/transcription of the audio message'),
  }),
}

export const telegramMessageChannels = {
  ...messages.defaults,
  audio: _audioMessageDefinition,
}
