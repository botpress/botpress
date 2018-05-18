import mware from 'mware'
import listeners from './listeners'

module.exports = () => {
  const chain = mware()
  const handler = (event, next) => {
    chain.run(event, function() {
      next.apply(this, arguments)
    })
  }

  const middleware = {
    name: 'hear',
    type: 'incoming',
    order: 20,
    module: 'botpress',
    description: 'The built-in hear convenience middleware',
    handler: handler
  }

  const hear = (condition, callback) => {
    chain(listeners.hear(condition, callback))
  }

  return { hear, middleware }
}
