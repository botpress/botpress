import EventEmitter2 from 'eventemitter2'

class EventBus extends EventEmitter2 {

  constructor() {
    super({
      wildcard: true,
      maxListeners: 100
    })
  }

  start() {
    if(this.started) {
      return
    } else {
      this.started = true
    }

    // TODO Change this to support prod
    const socket = this.socket = io.connect('http://localhost:3000')
    socket.on('event', (event) => {
      this.emit(event.name, event.data, 'server')
    })
    this.onAny(function(event, data, from) {
      if(from === 'server') {
        // we sent this event ourselves
        return
      }
      socket.emit('event', {
        name: event,
        data: data
      })
    })
  }

}

EventBus.default = new EventBus()

export default EventBus
