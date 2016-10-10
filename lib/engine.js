const _ = require('lodash')
const mware = require('mware')

const createMiddleware = function() {

  const _use = mware()
  const _error = mware()

  const use = function(middleware) {
    if(typeof(middleware) !== 'function') {
      throw new TypeError('Expected all middleware arguments to be functions')
    }

    if(middleware.length === 2) {
      _use(middleware)
    } else if(middleware.length === 3) {
      _error(middleware)
    }
  }

  const dispatch = function(event) {
    if(!_.isPlainObject(event)) {
      throw new TypeError('Expected all dispatch arguments to be plain event objects')
    }

    const conformity = {
      type: function(value) { return typeof(value) === 'string' },
      platform: function(value) { return typeof(value) === 'string' },
      text: function(value) { return typeof(value) === 'string' },
      raw: function(value) { return true }
    }

    if(!_.conformsTo(event, conformity)) {
      throw new TypeError('Expected event to contain (type: string), ' +
        '(platform: string), (text: string), (raw: any)')
    }

    _use.run(event, function(err) {
      if(err) {
        _error.run(err, event, _.noop)
      }
    })
  }

  return function() {
    if (arguments.length === 0) {
      throw new TypeError('Expected a middleware function or a plain object to dispatch in parameters')
    }

    if (typeof(arguments[0]) === 'function') {
      _.forEach(arguments, use)
    } else if(_.isPlainObject(arguments[0])) {
      _.forEach(arguments, dispatch)
    } else {
      throw new TypeError('Expected a middleware function or a plain object to ' +
        'dispatch in parameters but got ' + typeof(arguments[0]))
    }
  }
}

module.exports = function(skin) {
  skin.incoming = createMiddleware()
  skin.outgoing = createMiddleware()
}
