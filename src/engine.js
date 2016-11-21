import _ from 'lodash'
import mware from 'mware'
import path from 'path'
import fs from 'fs'

const createMiddleware = function(bp, middlewareName) {

  const _use = mware()
  const _error = mware()

  const use = function(middleware) {
    if (typeof(middleware) !== 'function') {
      throw new TypeError('Expected all middleware arguments to be functions')
    }

    if (middleware.length === 2) {
      _use(middleware)
    } else if (middleware.length === 3) {
      _error(middleware)
    }
  }

  const dispatch = function(event) {
    if (!_.isPlainObject(event)) {
      throw new TypeError('Expected all dispatch arguments to be plain event objects')
    }

    const conformity = {
      type: function(value) { return typeof(value) === 'string' },
      platform: function(value) { return typeof(value) === 'string' },
      text: function(value) { return typeof(value) === 'string' },
      raw: function(value) { return true }
    }

    if (!_.conformsTo(event, conformity)) {
      throw new TypeError('Expected event to contain (type: string), ' +
        '(platform: string), (text: string), (raw: any)')
    }

    // Provide botpress to the event handlers
    event.bp = bp

    _use.run(event, function(err) {
      if (err) {
        _error.run(err, event, () => {
          bp.logger.error('[botpress] Unhandled error in middleware (' 
            + middlewareName + '), error:', err.message)
        })
      }
    })
  }

  return function() {
    if (arguments.length === 0) {
      throw new TypeError('Expected a middleware function or a plain object to dispatch in parameters')
    }

    if (typeof(arguments[0]) === 'function') {
      _.forEach(arguments, use)
    } else if (_.isPlainObject(arguments[0])) {
      _.forEach(arguments, dispatch)
    } else {
      throw new TypeError('Expected a middleware function or a plain object to ' +
        'dispatch in parameters but got ' + typeof(arguments[0]))
    }
  }
}

module.exports = function(bp) {
  const middlewaresFilePath = path.join(bp.dataLocation, 'middlewares.json')

  const readMiddlewaresCustomizations = () => {  
    if (!fs.existsSync(middlewaresFilePath)) {
      fs.writeFileSync(middlewaresFilePath, '{}')
    }
    return JSON.parse(fs.readFileSync(middlewaresFilePath))
  }

  const writeMiddlewaresCustomizations = () => {
    fs.writeFileSync(middlewaresFilePath, JSON.stringify(bp.middlewareCustomizations))
  }

  bp.setMiddlewaresCustomizations = (middlewares) => {
    middlewares.forEach(middleware => {
      const { name, order, enabled } = middleware
      bp.middlewareCustomizations[name] = { order, enabled }
    })
    writeMiddlewaresCustomizations()
  }

  bp.resetMiddlewaresCustomizations = () => {
    bp.middlewareCustomizations = {}
    writeMiddlewaresCustomizations()
  }

  bp.middlewares = []
  bp.middlewareCustomizations = readMiddlewaresCustomizations()

  bp.registerMiddleware = (middleware) => {
    if (!middleware || !middleware.name) {
      bp.logger.error('A unique middleware name is mandatory')
      return false
    }

    if (!middleware.handler) {
      bp.logger.error('A middleware handler is mandatory')
      return false
    }

    if (!middleware.type || (middleware.type !== 'incoming' && middleware.type !== 'outgoing')) {
      bp.logger.error('A middleware type (incoming or outgoing) is required')
      return false
    }

    middleware.order = middleware.order || 0
    middleware.enabled = typeof middleware.enabled === 'undefined' ? true: !!middleware.enabled

    if (_.some(bp.middlewares, m => m.name === middleware.name)) {
      bp.logger.error('An other middleware with the same name has already been registered')
      return false
    }

    bp.middlewares.push(middleware)
  }

  bp.getMiddlewares = () => {
    return _.orderBy(bp.middlewares.map(middleware => {
      const customization = bp.middlewareCustomizations[middleware.name]
      if (customization) {
        return Object.assign({}, middleware, customization)
      }
      return middleware
    }), 'order')
  }

  bp.loadMiddlewares = () => {
    bp.incoming = createMiddleware(bp, 'incoming')
    bp.outgoing = createMiddleware(bp, 'outgoing')

    bp.getMiddlewares().forEach(m => {
      if (!m.enabled) {
        return bp.logger.debug('SKIPPING middleware:', m.name, ' [Reason=disabled]')
      }

      bp.logger.debug('Loading middleware:', m.name)
      bp[m.type](m.handler) // apply middleware
    })
  }
}
