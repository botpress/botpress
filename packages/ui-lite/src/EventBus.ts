import { EventEmitter2 } from 'eventemitter2'
import nanoid from 'nanoid'
import io from 'socket.io-client'
import { getToken } from '../../ui-shared-lite/auth'
import storage from '../../ui-shared-lite/utils/storage'

export const authEvents = new EventEmitter2()

const setVisitorId = (userId: string, userIdScope?: string) => {
  if (typeof userId === 'string' && userId !== 'undefined') {
    storage.set(userIdScope ? `bp/socket/${userIdScope}/user` : 'bp/socket/user', userId)
    window.__BP_VISITOR_ID = userId
  }
}

const getUniqueVisitorId = (userIdScope?: string): string => {
  const key = userIdScope ? `bp/socket/${userIdScope}/user` : 'bp/socket/user'

  let userId = storage.get(key)
  if (typeof userId !== 'string' || userId === 'undefined') {
    userId = nanoid(24)
    storage.set(key, userId)
  }

  window.__BP_VISITOR_ID = userId
  return userId
}

class EventBus extends EventEmitter2 {
  private adminSocket!: SocketIOClient.Socket
  private guestSocket!: SocketIOClient.Socket
  static default

  constructor() {
    super({ wildcard: true, maxListeners: 100 })

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
  }

  private updateVisitorSocketId() {
    window.__BP_VISITOR_SOCKET_ID = this.guestSocket.id
  }

  setup = (userIdScope?: string) => {
    const query = {
      visitorId: getUniqueVisitorId(userIdScope)
    }

    const token = getToken()
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
