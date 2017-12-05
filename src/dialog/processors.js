import Mustache from 'mustache'
import _ from 'lodash'

module.exports = {
  default: {
    id: 'send-message',
    send: ({ message, originalEvent, state, flowContext }) => {
      // TODO Replace variables in the {{text}} if they exist

      console.log(state, flowContext, message.value)
      let rendered = message.value

      if (/{{/i.test(rendered)) {
        rendered = Mustache.render(rendered, {
          ...state,
          event: _.pick(originalEvent, ['raw', 'text', 'type', 'platform', 'user']),
          _context: {
            ..._.pick(flowContext, ['node', 'flowStack']),
            currentFlow: _.pick(flowContext.currentFlow, ['name', 'version', 'startNode'])
          }
        })
      }

      return originalEvent.reply(message.type, Object.assign({}, state, { text: rendered }))
    }
  }
}
