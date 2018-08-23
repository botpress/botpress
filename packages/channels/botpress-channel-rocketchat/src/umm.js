import util from 'util'
import _ from 'lodash'

import actions from './actions'

function getChannelId(event) {
  const channelId = event.channel
  if (!channelId) {
    throw new Error('Could not find channelId in the incoming event.')
  }

  return channelId
}

function getMessageTs(event) {
  const ts = _.get(event, 'ts') || _.get(event, 'raw.ts')

  if (!ts) {
    throw new Error('Could not find message timestamp (ts) in the incoming event.')
  }

  return ts
}

function processOutgoing({ event, blocName, instruction }) {
  const ins = Object.assign({}, instruction) // Create a shallow copy of the instruction

  ////////
  // PRE-PROCESSING
  ////////

  const optionsList = []

  for (const prop of optionsList) {
    delete ins[prop]
  }

  /////////
  /// Processing
  /////////

  if (!_.isNil(instruction.attachments)) {
    return actions.createAttachments(getChannelId(event), instruction.attachments, instruction.options)
  }

  if (!_.isNil(instruction.attachment)) {
    return actions.createAttachments(getChannelId(event), [instruction.attachment], instruction.options)
  }

  if (!_.isNil(instruction.text)) {
    return actions.createText(getChannelId(event), instruction.text, event)
  }

  if (!_.isNil(instruction.reaction)) {
    return actions.createReaction(
      instruction.reaction,
      Object.assign(
        {},
        {
          timestamp: getMessageTs(event),
          channel: getChannelId(event)
        },
        instruction.options
      )
    )
  }

  ////////////
  /// POST-PROCESSING
  ////////////

  // Nothing to post-process yet

  ////////////
  /// INVALID INSTRUCTION
  ////////////

  const strRep = util.inspect(instruction, false, 1)
  throw new Error(`Unrecognized instruction on RocketChat in bloc '${blocName}': ${strRep}`)
}

module.exports = bp => {
  const [umm, registerConnector] = _.at(bp, ['umm', 'umm.registerConnector'])

  umm &&
    registerConnector &&
    registerConnector({
      platform: 'rocketchat',
      processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
      templates: []
    })
}
