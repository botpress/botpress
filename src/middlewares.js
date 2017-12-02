import _ from 'lodash'
import mware from 'mware'
import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'

const createMiddleware = (bp, middlewareName) => {
  const _use = mware()
  const _error = mware()

  const use = middleware => {
    if (typeof middleware !== 'function') {
      throw new TypeError('Expected all middleware arguments to be functions')
    }

    if (middleware.length === 2) {
      _use(middleware)
    } else if (middleware.length === 3) {
      _error(middleware)
    }
  }

  const dispatch = event => {
    if (!_.isPlainObject(event)) {
      throw new TypeError('Expected all dispatch arguments to be plain event objects')
    }

    const conformity = {
      type: value => typeof value === 'string',
      platform: value => typeof value === 'string',
      text: value => typeof value === 'string',
      raw: () => true
    }

    if (!_.conformsTo(event, conformity)) {
      throw new TypeError(
        'Expected event to contain (type: string), ' + '(platform: string), (text: string), (raw: any)'
      )
    }

    // Provide botpress to the event handlers
    event.bp = bp

    _use.run(event, err => {
      if (err) {
        _error.run(err, event, () => {
          bp.logger.error(`[BOTPRESS] Unhandled error in middleware (${middlewareName}). Error: ${err.message}`)
        })
      }
    })

    return event._promise || Promise.resolve()
  }

  return { use, dispatch }
}

module.exports = (bp, dataLocation, projectLocation, logger) => {
  const middlewaresFilePath = path.join(dataLocation, 'middlewares.json')
  let incoming, outgoing, middlewares, customizations

  const noopChain = arg => {
    let message =
      'Middleware called before middlewares have been loaded. This is a no-op.' +
      ' Have you forgotten to call `bp.loadMiddlewares()` in your bot?'

    if (arg && typeof arg === 'object') {
      message += '\nCalled with: ' + JSON.stringify(arg, null, 2)
    }

    logger.warn(message)
  }

  const readCustomizations = () => {
    if (!fs.existsSync(middlewaresFilePath)) {
      fs.writeFileSync(middlewaresFilePath, '{}')
    }
    return JSON.parse(fs.readFileSync(middlewaresFilePath))
  }

  const writeCustomizations = () => {
    fs.writeFileSync(middlewaresFilePath, JSON.stringify(customizations))
  }

  const setCustomizations = middlewares => {
    _.each(middlewares, middleware => {
      const { name, order, enabled } = middleware
      customizations[name] = { order, enabled }
    })
    writeCustomizations()
  }

  const resetCustomizations = () => {
    customizations = {}
    writeCustomizations()
  }

  const register = middleware => {
    if (!middleware || !middleware.name) {
      logger.error('A unique middleware name is mandatory')
      return false
    }

    if (!middleware.handler) {
      logger.error('A middleware handler is mandatory')
      return false
    }

    if (!middleware.type || (middleware.type !== 'incoming' && middleware.type !== 'outgoing')) {
      logger.error('A middleware type (incoming or outgoing) is required')
      return false
    }

    middleware.order = middleware.order || 0
    middleware.enabled = typeof middleware.enabled === 'undefined' ? true : !!middleware.enabled

    if (_.some(middlewares, m => m.name === middleware.name)) {
      logger.error('Another middleware with the same name has already been registered')
      return false
    }

    middlewares.push(middleware)
  }

  const list = () => {
    return _.orderBy(
      middlewares.map(middleware => {
        const customization = customizations[middleware.name]
        if (customization) {
          return Object.assign({}, middleware, customization)
        }
        return middleware
      }),
      'order'
    )
  }

  const load = () => {
    incoming = createMiddleware(bp, 'incoming')
    outgoing = createMiddleware(bp, 'outgoing')

    const { middleware: licenseMiddleware } = bp.licensing
    incoming.use(licenseMiddleware)

    _.each(list(), m => {
      if (!m.enabled) {
        return logger.debug('SKIPPING middleware:', m.name, ' [Reason=disabled]')
      }

      logger.debug('Loading middleware:', m.name)

      if (m.type === 'incoming') {
        incoming.use(m.handler)
      } else {
        outgoing.use(m.handler)
      }
    })
  }

  const sendToMiddleware = type => event => {
    const mw = type === 'incoming' ? incoming : outgoing
    return mw.dispatch ? mw.dispatch(event) : mw(event)
  }

  incoming = outgoing = noopChain
  middlewares = []
  customizations = readCustomizations()

  return {
    load,
    list,
    register,
    sendIncoming: event => bp.messages.in.enqueue(event),
    sendOutgoing: event => bp.messages.out.enqueue(event),
    sendIncomingImmediately: sendToMiddleware('incoming'),
    sendOutgoingImmediately: sendToMiddleware('outgoing'),
    getCustomizations: () => customizations,
    setCustomizations,
    resetCustomizations
  }
}
