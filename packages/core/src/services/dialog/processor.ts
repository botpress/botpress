import _ from 'lodash'
import mustache from 'mustache'

export const DialogProcessor = {
  default: {
    id: 'send-message',
    send: ({ message, originalEvent, state, flowContext }) => {
      let rendered = message.value

      const additionalData = { state: state }

      if (/{{/i.test(rendered)) {
        rendered = mustache.render(rendered, {
          ...state,
          event: _.pick(originalEvent, ['raw', 'text', 'type', 'platform', 'user']),
          _context: {
            ..._.pick(flowContext, ['node', 'flowStack']),
            currentFlow: _.pick(flowContext.currentFlow, ['name', 'version', 'startNode'])
          }
        })
      }

      if (/^{.+}$/.test(rendered)) {
        // Check if it's JSON
        Object.assign(additionalData, JSON.parse(rendered))
      } else if (!_.isEmpty(rendered)) {
        Object.assign(additionalData, { text: rendered })
      }

      return originalEvent.reply(message.type, additionalData)
    }
  }
}
