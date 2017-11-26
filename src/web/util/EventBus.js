/* global io */

import EventEmitter2 from 'eventemitter2'
import io from 'socket.io-client'

import { getToken, authEvents, getUniqueVisitorId } from '~/util/Auth'

class EventBus extends EventEmitter2 {
  constructor() {
    super({
      wildcard: true,
      maxListeners: 100
    })

    this.dispatchSocketEvent = this.dispatchSocketEvent.bind(this)
    this.setup = this.setup.bind(this)

    this.onAny(this.dispatchClientEvent)

    authEvents.on('new_token', this.setup)
  }

  dispatchSocketEvent(event) {
    this.emit(event.name, event.data, 'server')
  }

  dispatchClientEvent(name, data, from) {
    if (from === 'server') {
      // we sent this event ourselves
      return
    }

    let c = name.startsWith('guest.') ? this.guestSocket : this.adminSocket
    c && c.emit('event', { name, data: data })
  }

  setup() {
    let query = {
      visitorId: getUniqueVisitorId()
    }

    if (window.AUTH_ENABLED) {
      const token = getToken()
      if (!!token) {
        Object.assign(query, { token: token.token })
      }
    }

    if (this.adminSocket) {
      this.adminSocket.off('event', this.dispatchEvent)
      this.adminSocket.disconnect()
    }

    if (this.guestSocket) {
      this.guestSocket.off('event', this.dispatchEvent)
      this.guestSocket.disconnect()
    }

    let socketUrl = window.location.origin

    this.adminSocket = io(socketUrl + '/admin', { query })
    this.adminSocket.on('event', this.dispatchSocketEvent)

    this.guestSocket = io(socketUrl + '/guest')
    this.guestSocket.on('event', this.dispatchSocketEvent)
  }
}

EventBus.default = new EventBus()

export default EventBus
