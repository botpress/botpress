import fs from 'fs' // TODO remove
import path from 'path'
import util from 'util'

import _ from 'lodash'
import Promise from 'bluebird'

import Engine from './engine'

module.exports = ({ logger, middlewares }) => {

  const processors = {} // A map of all the platforms that can process outgoing messages
  const templates = {} // A map of all the platforms templates

  function registerConnector({ platform, processOutgoing, templates }) {

    // TODO throw if templates not array
    // TODO throw if platform not string
    // TODO throw if processOutgoing not a function
    // TODO throw if platform already registered

    logger.verbose(`[UMM] Enabled for ${platform}`) // TODO remove that

    processors[platform] = processOutgoing
    templates[platform] = templates
  }

  function parse({ context, outputPlatform, markdown = null, incomingEvent = null }) {
    // TODO throw if context empty
    
    // TODO throw if markdown nil <<<==== Pick default markdown
    // TODO throw if incomingEvents null <<<==== MOCK IT
    
    const options = {
      throwIfNoPlatform: true,
      currentPlatform: outputPlatform
    }

    return Engine({ markdown, context, options, processors, incomingEvent })
  }

  function getTemplates() {
    return _.merge({}, templates) // Return a deep copy
  }

  function processIncoming(event, next) {
    event.reply = (blocName, additionalData = {}) => {

      blocName = blocName[0] === '#' ? blocName.substr(1) : blocName

      // TODO Read from files or database
      const markdown = fs.readFileSync(path.resolve(__dirname, '../test.yml'), 'utf8').toString()

      // TODO Add more context
      const fullContext = Object.assign({
        user: event.user,
        originalEvent: event
      }, additionalData)

      const blocs = parse({
        context: fullContext,
        outputPlatform: event.platform,
        markdown: markdown,
        incomingEvent: event
      })

      // TODO check if message OK and catch errors
      // TODO throw if bloc does not exist
      
      const bloc = blocs[blocName]

      return Promise.mapSeries(bloc, message => {
        if (message.__internal) {
          // TODO Extract this
          if (message.type === 'wait') {
            return Promise.delay(message.wait)
          }
        } else {
          return middlewares.sendOutgoing(message)
        }
      })
    }

    next()
  }

  const incomingMiddleware = {
    name: 'UMM.instrumentation',
    type: 'incoming',
    order: 2, // Should really be first
    module: 'botpress',
    description: 'Built-in Botpress middleware that adds a `.reply` to events. Works with UMM.',
    handler: processIncoming
  }

  return { registerConnector, parse, getTemplates, incomingMiddleware }
}
