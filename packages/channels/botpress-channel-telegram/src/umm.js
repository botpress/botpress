import util from 'util'
import _ from 'lodash'
import Promise from 'bluebird'
import actions from './actions'

// TODO Extract this logic directly to botpress's UMM
function getUserId(event) {
  const userId =
    _.get(event, 'user.id') ||
    _.get(event, 'user.userId') ||
    _.get(event, 'userId') ||
    _.get(event, 'raw.from.id') ||
    _.get(event, 'raw.userId') ||
    _.get(event, 'raw.user.id')

  if (!userId) {
    throw new Error('Could not find userId in the incoming event.')
  }

  return userId
}

function PromisifyEvent(event) {
  if (!event._promise) {
    event._promise = new Promise((resolve, reject) => {
      event._resolve = resolve
      event._reject = reject
    })
  }

  return event
}

function processOutgoing({ event, blocName, instruction }) {
  const ins = Object.assign({}, instruction) // Create a shallow copy of the instruction

  ////////
  // PRE-PROCESSING
  ////////

  const optionsList = ['typing']

  const options = _.pick(instruction, optionsList)

  for (const prop of optionsList) {
    delete ins[prop]
  }

  /////////
  /// Processing
  /////////

  if (!_.isNil(instruction.text)) {
    return actions.createText({ chatId: event.chat.id, userId: getUserId(event) }, instruction.text, options)
  }

  ////////////
  /// POST-PROCESSING
  ////////////

  // Nothing to post-process yet

  ////////////
  /// INVALID INSTRUCTION
  ////////////

  const strRep = util.inspect(instruction, false, 1)
  throw new Error(`Unrecognized instruction on Web in bloc '${blocName}': ${strRep}`)
}

////////////
/// TEMPLATES
////////////

function getTemplates() {
  return [
    {
      type: 'Text - Single message',
      template: 'block_name_sm:\n  - Text goes here..'
    },
    {
      type: 'Text - Multiple messages',
      template: 'block_name_mm:\n  - Text goes here..(1)\n  - Text goes here..(2)'
    },
    {
      type: 'Text - Random message',
      template: 'block_name_rm:\n  - text:\n    - Text goes here..(1)\n    - Text goes here..(2)'
    },
    {
      type: 'Typing - Message with typing',
      template: 'block_name_bm:\n  - text: Text goes here..(1)\n    typing: 1000ms'
    }
  ]
}

module.exports = bp => {
  const [renderers, registerConnector] = _.at(bp, ['renderers', 'renderers.registerConnector'])

  renderers &&
    registerConnector &&
    registerConnector({
      platform: 'telegram',
      processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
      templates: getTemplates()
    })
}
