import { auth } from 'botpress/shared'
import { EventEmitter2 } from 'eventemitter2'
import io from 'socket.io-client'

// Copied mostly as-is from ui-studio
class EventBus extends EventEmitter2 {
  private adminSocket!: SocketIOClient.Socket
  private guestSocket!: SocketIOClient.Socket
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

    const socket = name.startsWith('guest.') ? this.guestSocket : this.adminSocket
    socket && socket.emit('event', { name, data })
  }

  private updateVisitorSocketId() {
    window.__BP_VISITOR_SOCKET_ID = this.guestSocket.id
  }

  setup = (customVisitorId?: string) => {
    const query = {
      visitorId: customVisitorId || auth.getUniqueVisitorId('admin')
    }

    const token = auth.getToken()
    if (token) {
      Object.assign(query, { token })
    }

    if (this.adminSocket) {
      this.adminSocket.off('event', this.dispatchSocketEvent)
      this.adminSocket.disconnect()
    }

    if (this.guestSocket) {
      this.guestSocket.off('event', this.dispatchSocketEvent)
      this.guestSocket.off('connect', this.updateVisitorSocketId)
      this.guestSocket.disconnect()
    }

    const socketUrl = window['BP_SOCKET_URL'] || window.location.origin
    const transports = window.SOCKET_TRANSPORTS

    this.adminSocket = io(`${socketUrl}/admin`, {
      query,
      transports,
      path: `${window['ROOT_PATH']}/socket.io`
    })
    this.adminSocket.on('event', this.dispatchSocketEvent)

    this.guestSocket = io(`${socketUrl}/guest`, { query, transports, path: `${window['ROOT_PATH']}/socket.io` })

    this.guestSocket.on('connect', this.updateVisitorSocketId.bind(this))
    this.guestSocket.on('event', this.dispatchSocketEvent)
  }
}

EventBus.default = new EventBus()

export default EventBus
