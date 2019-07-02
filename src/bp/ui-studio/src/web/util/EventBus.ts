import { EventEmitter2 } from 'eventemitter2'
import io from 'socket.io-client'
import { authEvents, getToken, getUniqueVisitorId, setVisitorId } from '~/util/Auth'

class EventBus extends EventEmitter2 {
  private adminSocket
  private guestSocket
  static default

  constructor() {
    super({
      wildcard: true,
      maxListeners: 100
    })

    this.onAny(this.dispatchClientEvent)

    authEvents.on('new_token', this.setup)
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

  updateVisitorId = (newId: string, userIdScope?: string) => {
    setVisitorId(newId, userIdScope)
    this.setup(userIdScope)
  }

  setup = (userIdScope?: string) => {
    const query = {
      visitorId: getUniqueVisitorId(userIdScope)
    }

    const token = getToken()
    if (token) {
      Object.assign(query, { token: token.token })
    }

    if (this.adminSocket) {
      this.adminSocket.off('event', this.dispatchSocketEvent)
      this.adminSocket.disconnect()
    }

    if (this.guestSocket) {
      this.guestSocket.off('event', this.dispatchSocketEvent)
      this.guestSocket.disconnect()
    }

    const socketUrl = window['BP_SOCKET_URL'] || window.location.origin

    this.adminSocket = io(socketUrl + '/admin', { query })
    this.adminSocket.on('event', this.dispatchSocketEvent)

    this.guestSocket = io(socketUrl + '/guest', { query })
    this.guestSocket.on('event', this.dispatchSocketEvent)
  }
}

EventBus.default = new EventBus()

export default EventBus
