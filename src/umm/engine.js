import Mustache from 'mustache'
import yaml from 'js-yaml'
import ms from 'ms'
import _ from 'lodash'

// TODO: can use typed-error that handles stack capturing
class ParsingError extends Error {
  constructor(bloc, instructionIndex, error) {
    super(`Error parsing bloc '${bloc}' at instruction ${instructionIndex + 1}: ${error}`)
    this.bloc = bloc
    this.instructionIndex = instructionIndex
    this.internalMessage = error
    Error.captureStackTrace(this, ParsingError)
  }
}

const premapInstruction = ({ currentPlatform }) => ({ instruction, index, instructions, detectedPlatforms, bloc }) => {
  if (typeof instruction === 'string' || _.isArray(instruction)) {
    return [
      {
        text: instruction
      }
    ]
  }

  // Parsing conditionals
  const evaluate = (val, exp) => {
    if (typeof exp === 'boolean') {
      return val === exp
    }
    if (_.isArrayLike(exp)) {
      return val ? !_.isEmpty(exp) : _.isEmpty(exp)
    } else {
      return val ? !!exp : !exp
    }
  }

  if (!_.isNil(instruction.if) && !_.isNil(instruction.unless)) {
    throw new ParsingError(bloc, index, "Message can't be both 'if' and 'else'.")
  }

  if (!_.isNil(instruction.unless) && !evaluate(false, instruction.unless)) {
    return []
  }

  if (!_.isNil(instruction.if) && !evaluate(true, instruction.if)) {
    return []
  }

  // Parsing ".on"
  let i = Object.assign({}, instruction)
  if (instruction.on) {
    if (typeof instruction.on === 'string') {
      const platforms = instruction.on
        .toLowerCase()
        .split('+')
        .map(_.trim)
      if (!_.includes(platforms, currentPlatform.toLowerCase())) {
        return []
      } else {
        i['__platformSpecific'] = true
      }
    } else if (_.isPlainObject(instruction.on)) {
      const on = _.mapKeys(instruction.on, (__, key) => key.toLowerCase())

      // This allows multiple platforms to be specified
      // e.g. "messenger+slack+web"
      _.keys(on).forEach(key => {
        if (key.indexOf('+') >= 0) {
          _.split(key, '+').forEach(alias => {
            const trimmed = _.trim(alias)
            on[trimmed] = _.merge({}, on[trimmed] || {}, on[key])
          })
        }
      })

      i = Object.assign(i, on[currentPlatform.toLowerCase()], { on: currentPlatform })
    } else {
      throw new ParsingError(bloc, index, '"on" must be a string or a plain object but was a ' + typeof instruction.on)
    }
  }

  return [i]
}

const mapInstruction = ({ currentPlatform, processors, incomingEvent }) => ({ instruction, messages, bloc }) => {
  const ret = []

  if (!_.isNil(instruction.wait)) {
    ret.push({
      __internal: true,
      type: 'wait',
      wait: _.isString(instruction.wait) ? ms(instruction.wait || 1000) : parseInt(instruction.wait) || 1000
    })
  }

  if (!_.isNil(instruction.typing)) {
    instruction.typing = _.isString(instruction.typing)
      ? ms(instruction.typing || 1000)
      : parseInt(instruction.typing) || 1000
  }

  const raw = _.omit(instruction, ['unless', 'if', 'on', 'wait'])

  if (!_.keys(raw).length) {
    return ret
  }

  if (_.isArray(instruction.text)) {
    instruction.text = _.sample(instruction.text)
  }

  const processor = currentPlatform && processors[currentPlatform]
  if (processor) {
    const msg = processor({ instruction, messages, blocName: bloc, event: incomingEvent })
    if (msg) {
      ret.push(msg)
    }

    return ret
  }

  throw new Error('Unsupported platform: ' + currentPlatform)
}

const mapBlocs = (rawBlocs, options, processors, incomingEvent) => {
  const { currentPlatform, throwIfNoPlatform = false } = options

  if (!currentPlatform && throwIfNoPlatform) {
    throw new Error('You need to supply `currentplatform`')
  }

  const _premapInstruction = premapInstruction({ currentPlatform })
  const _mapInstruction = mapInstruction({ currentPlatform, processors, incomingEvent })

  const mapBloc = (bloc, name) => {
    // if the bloc isn't an array, error

    const messages = []
    const detectedPlatforms = []
    const instructions = []

    // Premapping allows for modifications, drop and addition of instructions
    _.forEach(bloc, (instruction, index) => {
      const add = _premapInstruction({
        instruction,
        index,
        instructions: bloc,
        detectedPlatforms,
        bloc: name
      })

      add && _.forEach(add, i => instructions.push(i))
    })

    _.forEach(instructions, instruction => {
      const m = _mapInstruction({ instruction, messages, bloc: name })

      if (!_.isNil(m)) {
        // Messages can be null when the instruction only modified existing messages
        m.forEach(message => messages.push(message))
      }
    })

    return messages
  }

  return _.mapValues(rawBlocs, mapBloc)
} // mapBlocs

module.exports = ({ markdown, context, options, processors, incomingEvent }) => {
  Mustache.parse(markdown)

  let mustached = Mustache.render(markdown, context)

  // We're running it a second time to do second-level variable replacement
  // This happens often when there are variables used in the Content Manager
  mustached = Mustache.render(mustached, context)

  // The reason we support multi-doc is that people might want to separate documents
  // Both visually and practically when the file gets large
  const rawBlocs = {}
  yaml.safeLoadAll(mustached, rawBloc => Object.assign(rawBlocs, rawBloc))

  return mapBlocs(rawBlocs, options, processors, incomingEvent)
}
