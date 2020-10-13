const _ = require('lodash')

const channels = ['api', 'web']
if ((event.payload.quick_replies || event.payload.choices) && channels.includes(event.channel)) {
  event.payload = {
    type: 'custom',
    module: 'channel-web',
    component: 'QuickReplies',
    quick_replies: event.payload.quick_replies || event.payload.choices,
    wrapped: {
      type: 'text',
      ..._.omit(event.payload, 'quick_replies')
    }
  }
  event.type = 'custom'
}
