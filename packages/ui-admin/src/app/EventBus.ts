import { auth } from 'botpress/shared'
import { EventEmitter2 } from 'eventemitter2'
import { Socket, io } from 'socket.io-client'

// Copied mostly as-is from ui-studio
class EventBus extends EventEmitter2 {
  private adminSocket!: Socket
  static default: EventBus

  constructor() {
    super({ wildcard: true, maxListeners: 100 })

    this.onAny(this.dispatchClientEvent)
  }

  dispatchSocketEvent = event => {
    this.emit(event.name, event.data, 'server')
  }

  dispatchClientEvent = (name, data, from) => {
    if (from === 'server') {
      // we sent this event ourselves
      return
    }

    const socket = this.adminSocket
    socket && socket.emit('event', { name, data })
  }

  setup = (customVisitorId?: string) => {
    const query = {
      visitorId: customVisitorId || auth.getUniqueVisitorId('admin')
    }

    if (this.adminSocket) {
      this.adminSocket.off('event', this.dispatchSocketEvent)
      this.adminSocket.disconnect()
    }

    const socketUrl = window['BP_SOCKET_URL'] || window.location.origin
    const transports = window.SOCKET_TRANSPORTS
    const token = auth.getToken()

    this.adminSocket = io(`${socketUrl}/admin`, {
      auth: { token },
      query,
      transports,
      path: `${window['ROOT_PATH']}/socket.io`
    })
    this.adminSocket.on('event', this.dispatchSocketEvent)
  }
}

EventBus.default = new EventBus()

export default EventBus
