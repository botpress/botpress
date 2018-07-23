/**
 * The Content Renderer is in charge of transforming an {@link ContentManager~Element}
 * into a channel-specific object.
 * @namespace ContentRenderer
 * @example
 * bp.renderers
 */

import _ from 'lodash'
import Promise from 'bluebird'

import Engine from './engine'
import Proactive from './proactive'

module.exports = ({ logger, middlewares, db, contentManager, botfile }) => {
  const processors = {} // A map of all the platforms that can process outgoing messages
  const renderers = {} // A map of all the registered renderers

  const registerChannel = ({ platform, processOutgoing }) => {
    if (!_.isString(platform)) {
      throw new Error(`[Renderers] Platform must be a string, got: ${platform}.`)
    }
    if (processors[platform]) {
      throw new Error(`[Renderers] Platform should only be registered once, platform: ${platform}.`)
    }
    if (!_.isFunction(processOutgoing)) {
      throw new Error(`[Renderers] processOutgoing must be a function, platform: ${platform}.`)
    }

    logger.verbose(`[Renderers] Enabled for ${platform}.`)

    processors[platform] = processOutgoing
  }

  /**
   * @callback Renderer
   * @memberof! ContentRenderer
   * @example
   * bp.renderers.register('#text', data => ({ text: data.englishText }))
   */

  /**
   * Registers a new renderer
   * @param  {String} name Unique name of the renderer (e.g. `#text`).
   * @param  {ContentRenderer.Renderer} rendererFn The rendering function
   * @memberOf! ContentRenderer
   */
  const register = (name, rendererFn) => {
    if (!_.isString(name)) {
      throw new Error(`Renderer name must be a string, received ${name}`)
    }
    if (name.startsWith('#')) {
      name = name.substr(1)
    }

    renderers[name] = rendererFn
  }

  /**
   * Removes a specific renderer if it exists
   * @param  {String} name Unique name of the renderer (e.g. `#text`)
   * @memberOf! ContentRenderer
   */
  const unregister = name => {
    if (!_.isString(name)) {
      throw new Error(`Renderer name must be a string, received ${name}`)
    }
    if (name.startsWith('#')) {
      name = name.substr(1)
    }
    delete renderers[name]
  }

  /**
   * Returns whether or not a renderer is already registered
   * @param  {String} name Unique name of the renderer (e.g. `#text`)
   * @return {Boolean}
   * @memberOf! ContentRenderer
   */
  const isRegistered = name => {
    if (!_.isString(name)) {
      throw new Error(`Renderer name must be a string, received ${name}`)
    }
    if (name.startsWith('#')) {
      name = name.substr(1)
    }
    return !!renderers[name]
  }

  const invoke = ({ rendererFn, rendererName, context, outputPlatform, incomingEvent = null }) => {
    // TODO throw if incomingEvents null <<<==== MOCK IT

    const options = {
      throwIfNoPlatform: true,
      currentPlatform: outputPlatform
    }

    return Engine({ rendererFn, rendererName, context, options, processors, incomingEvent })
  }

  const doSendContent = async (rendererFn, { rendererName, context, outputPlatform, incomingEvent }) => {
    const messages = await invoke({ rendererFn, rendererName, context, outputPlatform, incomingEvent })

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

  const sendContent = async (incomingEvent, rendererName, additionalData = {}) => {
    rendererName = rendererName.startsWith('#') ? rendererName.substr(1) : rendererName

    // "magic" constants that can be used in the renderers
    const initialData = {
      BOT_URL: botfile.botUrl
    }

    if (rendererName.startsWith('!')) {
      const itemName = rendererName.substr(1)
      const contentItem = await contentManager.getItem(itemName)

      if (!contentItem) {
        throw new Error(`Could not find content item with ID "${itemName}" in the Content Manager`)
      }

      const { categoryId: itemCategoryId } = contentItem

      const itemCategory = contentManager.getCategorySchema(itemCategoryId)

      if (!itemCategory) {
        throw new Error(
          `Could not find category "${itemCategoryId}" in the Content Manager` + ` for item with ID "${itemName}"`
        )
      }

      const itemRenderer = itemCategory.renderer
      if (!_.isString(itemRenderer) || !itemRenderer.startsWith('#') || itemRenderer.length <= 1) {
        throw new Error(`Invalid renderer '${itemRenderer}' in category '${itemCategoryId}' of Content Manager.
         A renderer must start with '#'`)
      }

      rendererName = itemRenderer.substr(1)
      Object.assign(initialData, _.isArray(contentItem.data) ? { items: contentItem.data } : contentItem.data)
    }

    const fullContext = {
      ...initialData,
      user: incomingEvent.user,
      event: _.pick(incomingEvent, ['raw', 'text', 'type', 'platform', 'user']),
      ...additionalData
    }

    const renderer = renderers[rendererName]

    if (!renderer) {
      const error = `[Renderer] Renderer not defined (#${rendererName})`
      logger.error(error)
      throw new Error(error)
    }

    await doSendContent(renderer, {
      rendererName,
      context: fullContext,
      outputPlatform: incomingEvent.platform,
      incomingEvent
    })

    return {
      renderer: rendererName,
      context: fullContext,
      outputPlatform: incomingEvent.platform
    }
  }

  const processIncoming = (event, next) => {
    event.reply = (rendererName, additionalData = {}) => sendContent(event, rendererName, additionalData)
    next()
  }

  const incomingMiddleware = {
    name: 'rendering.instrumentation',
    type: 'incoming',
    order: 2, // Should really be first
    module: 'botpress',
    description: 'Built-in Botpress middleware that adds a `.reply` to events. Works with renderers.',
    handler: processIncoming
  }

  const proactiveMethods = Proactive({ sendContent, db })

  return {
    registerChannel,
    registerConnector: registerChannel, // DEPRECATED Use "channel" instead of "connector"
    register,
    unregister,
    isRegistered,
    incomingMiddleware,
    ...proactiveMethods
  }
}
