import EventEmitter2 from 'eventemitter2'

class EventBus extends EventEmitter2 {
  constructor() {
    super({
      wildcard: true,
      maxListeners: 100
    })
  }
}

module.exports = EventBus
