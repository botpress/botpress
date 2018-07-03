import Mustache from 'mustache'
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

const premapInstruction = ({ currentPlatform }) => ({
  instruction,
  index,
  instructions,
  detectedPlatforms,
  blocName
}) => {
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
    throw new ParsingError(blocName, index, "Message can't be both 'if' and 'else'.")
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
      throw new ParsingError(
        blocName,
        index,
        '"on" must be a string or a plain object but was a ' + typeof instruction.on
      )
    }
  }

  return [i]
}

const mapInstruction = ({ currentPlatform, processors, incomingEvent }) => ({ instruction, messages, blocName }) => {
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
    const msg = processor({ instruction, messages, blocName, event: incomingEvent })
    if (msg) {
      ret.push(msg)
    }

    return ret
  }

  throw new Error('Unsupported platform: ' + currentPlatform)
}

const mapBloc = (bloc, blocName, options, processors, incomingEvent) => {
  const { currentPlatform, throwIfNoPlatform = false } = options

  if (!currentPlatform && throwIfNoPlatform) {
    throw new Error('You need to supply `currentplatform`')
  }

  const _premapInstruction = premapInstruction({ currentPlatform })
  const _mapInstruction = mapInstruction({ currentPlatform, processors, incomingEvent })

  if (!Array.isArray(bloc)) {
    bloc = [bloc]
  }

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
      blocName
    })

    add && _.forEach(add, i => instructions.push(i))
  })

  _.forEach(instructions, instruction => {
    const m = _mapInstruction({ instruction, messages, blocName })

    if (m != null) {
      // Messages can be null when the instruction only modified existing messages
      m.forEach(message => messages.push(message))
    }
  })

  return messages
}

const renderMustache = (template, context) => {
  Mustache.parse(template)
  return Mustache.render(template, context)
}

const hydrateMustache = (obj, context) => {
  if (_.isString(obj)) {
    return renderMustache(obj, context)
  }
  if (Array.isArray(obj)) {
    return obj.map(v => hydrateMustache(v, context))
  }
  if (_.isObject(obj)) {
    return _.mapValues(obj, v => hydrateMustache(v, context))
  }
  return obj
}

module.exports = async ({ rendererName, rendererFn, context, options, processors, incomingEvent }) => {
  // We're running it a second time to do second-level variable replacement
  // This happens often when there are variables used in the Content Manager
  const rawBloc = hydrateMustache(hydrateMustache(await rendererFn(context), context), context)

  return mapBloc(rawBloc, rendererName, options, processors, incomingEvent)
}
