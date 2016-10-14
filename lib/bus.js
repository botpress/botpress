const EventEmitter2 = require('eventemitter2')

class EventBus extends EventEmitter2 {
  constructor() {
    super({
      wildcard: true,
      maxListeners: 100
    })
  }
}

module.exports = EventBus
