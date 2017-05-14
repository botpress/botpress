import fs from 'fs'
import path from 'path'

import Mustache from 'mustache'
import yaml from 'js-yaml'
import ms from 'ms'
import _ from 'lodash'

class ParsingError extends Error {
  constructor(bloc, instructionIndex, error) {
    super(`Error parsing bloc '${bloc}' at instruction ${instructionIndex + 1}: ${error}`)
    this.bloc = bloc
    this.instructionIndex = instructionIndex
    this.internalMessage = error
    Error.captureStackTrace(this, ParsingError)
  }
}

const mapBlocs = (rawBlocs, context, options) => {

  const {
    currentPlatform,
    platforms = [],
    throwIfNoPlatform = false
  } = options

  if (!currentPlatform && throwIfNoPlatform) {
    throw new Error('You need to supply `currentplatform`')
  }

  return _.mapValues(rawBlocs, mapBloc)

  function premapInstruction({ instruction, index, instructions, detectedPlatforms, bloc }) {

    if (typeof instruction === 'string') {
      return [{
        text: instruction
      }]
    }

    // Parsing conditionals
    const evaluate = (val, exp) => {
      if (typeof exp === 'boolean') {
        return val === exp
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
        if (currentPlatform.toLowerCase() !== instruction.on.toLowerCase()) {
          return []
        } else {
          i['__platformSpecific'] = true
        }
      } else if (_.isPlainObject(instruction.on)) {
        const on = _.mapKeys(instruction.on, (__, key) => key.toLowerCase())
        i = Object.assign(i, on[currentPlatform.toLowerCase()], { on: currentPlatform })
      } else {
        throw new ParsingError(bloc, index, '"on" must be a string or a plain object but was a ' 
          + typeof(instruction.on))
      }
    }

    return [i]
  }

  function mapInstruction({ instruction, messages, bloc }) {
    const ret = []

    if (instruction.wait) {
      ret.push({
        __internal: true,
        wait: ms(instruction.wait || 1000 )
      })
    }

    const raw = _.omit(instruction, ['unless', 'if', 'on', 'wait'])

    if (!_.keys(raw).length) {
      return ret
    }

    if (!currentPlatform) {

    }

    ret.push(instruction)

    return ret
  }

  function mapBloc(bloc, name) {
    // if the bloc isn't an array, error

    const messages = []
    const detectedPlatforms = []
    const instructions = []

    // Premapping allows for modifications, drop and addition of instructions
    _.forEach(bloc, (instruction, index) => {
      const add = premapInstruction({ 
        instruction, 
        index, 
        instructions: bloc, 
        detectedPlatforms, 
        bloc: name 
      })

      add && _.forEach(add, i => instructions.push(i))
    })

    _.forEach(instructions, instruction => {
      const m = mapInstruction({ instruction, messages, bloc: name })

      if (!_.isNil(m)) {
        // Messages can be null when the instruction only modified existing messages
        m.forEach(message => messages.push(message))
      }
    })

    return messages
  }

} // mapBlocs


const file = fs.readFileSync(path.resolve(__dirname, '../../test.yml'), 'utf8')
const context = { name: false, tweets: [ {author: 'Donald', text: 'I am the president' } ] }
Mustache.parse(file)

const mustached = Mustache.render(file, context)

// The reason we support multi-doc is that people might want to separate documents
// Both visually and practically when the file gets large
const rawBlocs = {}
yaml.safeLoadAll(mustached, rawBloc => Object.assign(rawBlocs, rawBloc))

const blocs = mapBlocs(rawBlocs, context, { currentPlatform: 'messenger' })

console.log(blocs)
