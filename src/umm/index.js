import fs from 'fs'
import path from 'path'
import util from 'util'

import _ from 'lodash'
import Promise from 'bluebird'

import Engine from './engine'
import Proactive from './proactive'

module.exports = ({ logger, middlewares, botfile, projectLocation, db }) => {

  const processors = {} // A map of all the platforms that can process outgoing messages
  const platforms = [] //List of the supported platforms
  const allTemplates = {} // A map of all the platforms templates

  function registerConnector({ platform, processOutgoing, templates }) {

    // TODO throw if templates not array
    // TODO throw if platform not string
    // TODO throw if processOutgoing not a function
    // TODO throw if platform already registered

    logger.verbose(`[UMM] Enabled for ${platform}`) // TODO remove that

    platforms.push(platform)
    processors[platform] = processOutgoing
    allTemplates[platform] = templates
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
    return _.merge({}, allTemplates) // Return a deep copy
  }

  function getPlatforms() {
    return platforms
  }

  function getStoragePath() {
    const ummPath = _.get(botfile, 'umm.contentPath') || 'content.yml'
    if (path.isAbsolute(ummPath)) {
      return ummPath
    } else {
      return path.resolve(projectLocation, ummPath)
    }
  }

  function saveDocument(content) {
    return fs.writeFileSync(getStoragePath(), content, 'utf8')
  }

  function getDocument() {
    return fs.readFileSync(getStoragePath(), 'utf8').toString()
  }

  function doSendBloc(bloc) {
    return Promise.mapSeries(bloc, message => {
      if (message.__internal) {
        if (message.type === 'wait') {
          return Promise.delay(message.wait)
        }
      } else {
        return middlewares.sendOutgoing(message)
      }
    })
  }

  function sendBloc(incomingEvent, blocName, additionalData = {}) {
    blocName = blocName[0] === '#' ? blocName.substr(1) : blocName
      
    const markdown = getDocument()

    // TODO Add more context
    const fullContext = Object.assign({
      user: incomingEvent.user,
      originalEvent: incomingEvent
    }, additionalData)

    const blocs = parse({
      context: fullContext,
      outputPlatform: incomingEvent.platform,
      markdown: markdown,
      incomingEvent: incomingEvent
    })

    // TODO check if message OK and catch errors
    // TODO throw if bloc does not exist
    
    const bloc = blocs[blocName]

    return doSendBloc(bloc)
  }

  function processIncoming(event, next) {
    event.reply = (blocName, additionalData = {}) => {
      return sendBloc(event, blocName, additionalData)
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


  const proactiveMethods = Proactive({ sendBloc, db })

  return { 
    registerConnector, 
    parse, 
    getTemplates, 
    getPlatforms, 
    incomingMiddleware, 
    getDocument, 
    saveDocument, 
    ...proactiveMethods
  }

}
