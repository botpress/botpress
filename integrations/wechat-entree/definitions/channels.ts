import { messages } from '@botpress/sdk'

const _textMessageDefinition = {
  ...messages.defaults.text,
  schema: messages.defaults.text.schema.extend({
    text: messages.defaults.text.schema.shape.text
      .max(4096)
      .describe('The text content of the WeChat message (Limit 4096 characters)'),
  }),
}

// ============== FOR FUTURE USE ==============
// const _imageMessageDefinition = {
//   ...messages.defaults.image,
//   schema: messages.defaults.image.schema.extend({
//     caption: z.string().optional().describe('The caption/description of the image'),
//   }),
// }

// const _audioMessageDefinition = {
//   ...messages.defaults.audio,
//   schema: messages.defaults.audio.schema.extend({
//     caption: z.string().optional().describe('The caption/transcription of the audio message'),
//   }),
// }
// =============================================

const _imageMessageDefinition = {
  ...messages.defaults.image,
}

export const wechatMessageChannels = {
  text: _textMessageDefinition,
  image: _imageMessageDefinition,
  video: messages.defaults.video,
}
