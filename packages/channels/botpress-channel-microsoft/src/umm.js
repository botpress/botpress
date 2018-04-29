import util from 'util'
import _ from 'lodash'

import actions from './actions'

function processOutgoing({ event, blocName, instruction }) {
  const ins = Object.assign({}, instruction) // Create a shallow copy of the instruction

  ////////
  // PRE-PROCESSING
  ////////

  const optionsList = []
  const options = _.pick(instruction, optionsList)

  for (const prop of optionsList) {
    delete ins[prop]
  }

  /////////
  /// Processing
  /////////

  if (!_.isNil(instruction.contentType) || !_.isNil(instruction.attachments) || instruction.type === 'message') {
    return actions.createObject(event, ins)
  }

  if (!_.isNil(instruction.text)) {
    return actions.createText(event, instruction.text)
  }

  ////////////
  /// POST-PROCESSING
  ////////////

  // Nothing to post-process yet

  ////////////
  /// INVALID INSTRUCTION
  ////////////

  const strRep = util.inspect(instruction, false, 1)
  throw new Error(`Unrecognized instruction on Bot Framework in bloc '${blocName}': ${strRep}`)
}

////////////
/// TEMPLATES
////////////

function getTemplates() {
  return []
}

module.exports = bp => {
  const [renderers, registerConnector] = _.at(bp, ['renderers', 'renderers.registerConnector'])

  renderers &&
    registerConnector &&
    registerConnector({
      platform: 'microsoft',
      processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
      templates: getTemplates()
    })
}
