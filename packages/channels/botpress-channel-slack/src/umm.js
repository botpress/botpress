import util from 'util'
import _ from 'lodash'

import actions from './actions'

function getChannelId(event) {
  const channelId =
    _.get(event, 'channel.id') ||
    _.get(event, 'user.channelId') ||
    _.get(event, 'channelId') ||
    _.get(event, 'raw.channelId') ||
    _.get(event, 'raw.channel.id') ||
    _.get(event, 'raw.channel')

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

  const options = _.pick(instruction, optionsList)

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
    return actions.createText(getChannelId(event), instruction.text, instruction.options)
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
  throw new Error(`Unrecognized instruction on Slack in bloc '${blocName}': ${strRep}`)
}

module.exports = bp => {
  const [renderers, registerConnector] = _.at(bp, ['renderers', 'renderers.registerConnector'])

  renderers &&
    registerConnector &&
    registerConnector({
      platform: 'slack',
      processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
      templates: []
    })
}
