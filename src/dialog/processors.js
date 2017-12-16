import Mustache from 'mustache'
import _ from 'lodash'

module.exports = {
  default: {
    id: 'send-message',
    send: ({ message, originalEvent, state, flowContext }) => {
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

      const additionalData = { ...state }

      if (!_.isEmpty(rendered)) {
        Object.assign(additionalData, { text: rendered })
      }

      return originalEvent.reply(message.type, additionalData)
    }
  }
}
