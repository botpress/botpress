import _ from 'lodash'

//import { GOOGLE_ASSISTANT } from './index'
const GOOGLE_ASSISTANT = 'googleAssistant'

const buildObjectRaw = (event, instruction, options, user) => {
  return {
    to: user,
    message: instruction.text || null,
    ...options,
    ..._.pick(event && event.raw, 'conversationId')
  }
}

const processOutgoing = ({ event, instruction }) => {
  if (_.isNil(instruction.text)) {
    return
  }
  return {
    platform: 'googleAssistant',
    type: 'message',
    user: { id: event.user.id },
    raw: buildObjectRaw(event, instruction, instruction, event.user.id),
    text: instruction.text
  }
}

const getTemplates = () => []

module.exports = bp => {
  const [renderers, registerChannel] = _.at(bp, ['renderers', 'renderers.registerChannel'])

  renderers &&
    registerChannel &&
    registerChannel({
      platform: GOOGLE_ASSISTANT,
      processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
      templates: getTemplates()
    })
}
