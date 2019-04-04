const _ = require('lodash')

if (event.payload.quick_replies) {
  event.payload = {
    type: 'custom',
    module: 'channel-web',
    component: 'QuickReplies',
    quick_replies: event.payload.quick_replies,
    wrapped: {
      type: 'text',
      ..._.omit(event.payload, 'quick_replies')
    }
  }
  event.type = 'custom'
}
