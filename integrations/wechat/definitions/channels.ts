import { messages } from '@botpress/sdk'

const _textMessageDefinition = {
  ...messages.defaults.text,
  schema: messages.defaults.text.schema.extend({
    text: messages.defaults.text.schema.shape.text
      .max(4096)
      .describe('The text content of the WeChat message (Limit 4096 characters)'),
  }),
}

const _imageMessageDefinition = {
  ...messages.defaults.image,
}

export const wechatMessageChannels = {
  text: _textMessageDefinition,
  image: _imageMessageDefinition,
  video: messages.defaults.video,
}
