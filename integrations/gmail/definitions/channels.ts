import * as sdk from '@botpress/sdk'

export const channels = {
  channel: {
    title: 'Email thread',
    description: 'Messages in an email thread',
    messages: {
      ...sdk.messages.defaults,
      markdown: sdk.messages.markdown,
      image: {
        schema: sdk.messages.defaults.image.schema.extend({
          title: sdk.z.string().optional().title('Alt text').describe('Alt text for the image'),
        }),
      },
      audio: {
        schema: sdk.messages.defaults.audio.schema.extend({
          title: sdk.z.string().optional().title('Title').describe('Title for the audio file'),
        }),
      },
      video: {
        schema: sdk.messages.defaults.video.schema.extend({
          title: sdk.z.string().optional().title('Title').describe('Title for the video file'),
        }),
      },
      file: {
        schema: sdk.messages.defaults.file.schema.extend({
          title: sdk.z.string().optional().title('Title').describe('Title for the file'),
        }),
      },
    },
    message: {
      tags: {
        id: { title: 'Gmail ID', description: 'The unique identifier of the message on Gmail' },
      },
    },
    conversation: {
      tags: {
        id: { title: 'Gmail ID', description: 'The unique identifier of the email thread on Gmail' },
        email: { title: 'Sender email', description: 'The email address of the sender' },
        subject: { title: 'Subject', description: 'The subject of the email' },
        references: { title: 'References', description: 'The contents of the References header field' },
        cc: { title: 'CC', description: 'Co-recipients' },
      },
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['channels']
