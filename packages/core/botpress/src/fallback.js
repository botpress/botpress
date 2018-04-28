import _ from 'lodash'
import listeners from './listeners'

module.exports = bp => {
  const middleware = {
    name: 'fallback',
    type: 'incoming',
    order: 200,
    module: 'botpress',
    description: 'The built-in fallback handler. You may override this by implementing bp.fallbackHandler',
    handler: (event, next) => {
      if (_.isFunction(bp.fallbackHandler)) {
        bp.fallbackHandler(event, next)
      }
    }
  }

  return { middleware }
}
