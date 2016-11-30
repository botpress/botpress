import listeners from './listeners'

module.exports = () => {

  const fns = []
  const handler = (event, next) => {
    let nextCalled = false
    let stubNext = function() {
      nextCalled = true
      next.apply(this, arguments)
    }

    for (let fn of fns) {
      if (nextCalled) break
      fn(event, stubNext)
    }
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
    fns.push(listeners.hear(condition, callback))
  }

  return { hear, middleware }
}
