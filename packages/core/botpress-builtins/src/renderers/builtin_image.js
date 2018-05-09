// TODO
// Add image support to Twilio (SMS)
// Add image support to Telegram

import url from 'url'
import mime from 'mime'

export default data => [
  {
    on: 'facebook',
    image: url.resolve(data.BOT_URL, data.image),
    typing: data.typing
  },
  {
    on: 'webchat',
    type: 'file',
    url: url.resolve(data.BOT_URL, data.image),
    typing: data.typing
  },
  {
    on: 'microsoft',
    attachments: [
      {
        contentType: mime.getType(data.image),
        contentUrl: data.image,
        name: data.title
      }
    ]
  },
  {
    on: 'slack',
    attachments: [
      {
        title: data.title,
        image_url: data.image
      }
    ]
  }
]
