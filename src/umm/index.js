import _ from 'lodash'
import Promise from 'bluebird'

import Engine from './engine'
import Proactive from './proactive'

module.exports = ({ logger, middlewares, botfile, projectLocation, db, contentManager }) => {
  const processors = {} // A map of all the platforms that can process outgoing messages
  const templates = {} // A map of all the platforms templates
  const blocs = {} // A map of all the registered UMM blocs

  const registerConnector = ({ platform, processOutgoing, templates }) => {
    if (!Array.isArray(templates)) {
      throw new Error(`[UMM] Templates must be an array, platform: ${platform}.`)
    }
    if (!_.isString(platform)) {
      throw new Error(`[UMM] Platform must be a string, got: ${platform}.`)
    }
    if (processors[platform]) {
      throw new Error(`[UMM] Platform should only be registered once, platform: ${platform}.`)
    }
    if (!_.isFunction(processOutgoing)) {
      throw new Error(`[UMM] processOutgoing must be a function, platform: ${platform}.`)
    }

    logger.verbose(`[UMM] Enabled for ${platform}.`)

    processors[platform] = processOutgoing
    templates[platform] = templates
  }

  const registerBloc = (blocName, blocFn) => {
    if (!_.isString(blocName)) {
      throw new Error(`Bloc name must be a string, received ${blocName}`)
    }
    if (blocName.startsWith('#')) {
      blocName = blocName.substr(1)
    }
    blocs[blocName] = blocFn
  }

  const invoke = ({ blocFn, context, outputPlatform, incomingEvent = null }) => {
    // TODO throw if incomingEvents null <<<==== MOCK IT

    const options = {
      throwIfNoPlatform: true,
      currentPlatform: outputPlatform
    }

    return Engine({ blocFn, context, options, processors, incomingEvent })
  }

  const getTemplates = () => _.merge({}, templates) // Return a deep copy

  const doSendBloc = (blocFn, { blocName, context, outputPlatform, incomingEvent }) => {
    const messages = invoke({ blocFn, blocName, context, outputPlatform, incomingEvent })

    return Promise.mapSeries(messages, message => {
      if (message.__internal) {
        if (message.type === 'wait') {
          return Promise.delay(message.wait)
        }
      } else {
        return middlewares.sendOutgoing(message)
      }
    })
  }

  const sendBloc = async (incomingEvent, blocName, additionalData = {}) => {
    blocName = blocName.startsWith('#') ? blocName.substr(1) : blocName

    const initialData = {}

    if (blocName.startsWith('!')) {
      const itemName = blocName.substr(1)
      const contentItem = await contentManager.getItem(itemName)

      if (!contentItem) {
        throw new Error(`Could not find content item with ID "${itemName}" in the Content Manager`)
      }

      const { categoryId: itemCategoryId } = contentItem

      const itemCategory = await contentManager.getCategorySchema(itemCategoryId)

      if (!itemCategory) {
        throw new Error(
          `Could not find category "${itemCategoryId}" in the Content Manager` + ` for item with ID "${itemName}"`
        )
      }

      const itemBloc = itemCategory.ummBloc
      if (!_.isString(itemBloc) || !itemBloc.startsWith('#') || itemBloc.length <= 1) {
        throw new Error(`Invalid UMM bloc "${itemBloc}" in category ${itemCategoryId} of Content Manager`)
      }

      blocName = itemBloc.substr(1)
      Object.assign(initialData, contentItem.data)
    }

    // TODO Add more context
    const fullContext = Object.assign(
      {},
      initialData,
      {
        user: incomingEvent.user,
        originalEvent: incomingEvent
      },
      additionalData
    )

    const bloc = blocs[blocName]

    if (!bloc) {
      const error = `[UMM] Bloc not defined (#${blocName})`
      logger.error(error)
      throw new Error(error)
    }

    return doSendBloc(bloc, {
      blocName,
      context: fullContext,
      outputPlatform: incomingEvent.platform,
      incomingEvent
    })
  }

  const processIncoming = (event, next) => {
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

  return { registerConnector, registerBloc, getTemplates, incomingMiddleware, ...proactiveMethods }
}
