import mware from 'mware'
import listeners from './listeners'

module.exports = () => {

  const { use, run } = mware()
  const handler = (event, next) => {
    run(event, function() {
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
    use(listeners.hear(condition, callback))
  }

  return { hear, middleware }
}
