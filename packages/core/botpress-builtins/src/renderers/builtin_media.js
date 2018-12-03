// TODO
// Add image support to Twilio (SMS)

import url from 'url'
import mime from 'mime'

export default data => [
  {
    on: 'facebook',
    [data.type]: data.url || url.resolve(data.BOT_URL, data.file),
    isReusable: data.reusable,
    messagingType: data.messagingType,
    tag: data.messagingTag,
    typing: data.typing
  },
  {
    on: 'webchat',
    type: 'file',
    url: data.url || url.resolve(data.BOT_URL, data.file),
    typing: data.typing
  },
  {
    on: 'microsoft',
    attachments: [
      {
        contentType: mime.getType(data.file),
        contentUrl: data.file,
        name: data.title
      }
    ]
  },
  {
    on: 'slack',
    attachments: [
      {
        title: data.title,
        image_url: data.file
      }
    ]
  },
  {
    on: 'telegram',
    photo: data.url || url.resolve(data.BOT_URL, data.file),
    options: {
      caption: data.title,
      parse_mode: 'Markdown'
    }
  }
]
