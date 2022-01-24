import { EventEmitter2 } from 'eventemitter2'
import { nanoid } from 'nanoid'
import { Socket, io } from 'socket.io-client'
import storage from '../../ui-shared-lite/utils/storage'

export const authEvents = new EventEmitter2()

const getStorageKey = (userIdScope?: string) => (userIdScope ? `bp/socket/${userIdScope}/user` : 'bp/socket/user')

const unsetVisitorId = (userIdScope?: string) => {
  storage.del(getStorageKey(userIdScope))
  window.__BP_VISITOR_ID = undefined
}

const setVisitorId = (userId: string, userIdScope?: string) => {
  if (typeof userId === 'string' && userId !== 'undefined') {
    storage.set(getStorageKey(userIdScope), userId)
    window.__BP_VISITOR_ID = userId
  }
}

const getUniqueVisitorId = (userIdScope?: string): string => {
  const key = getStorageKey(userIdScope)

  let userId = storage.get(key)
  if (typeof userId !== 'string' || userId === 'undefined') {
    userId = nanoid(24)
    storage.set(key, userId)
  }

  window.__BP_VISITOR_ID = userId
  return userId
}

class EventBus extends EventEmitter2 {
  private guestSocket!: Socket
  static default: EventBus

  constructor() {
    super({ wildcard: true, maxListeners: 100 })

    this.onAny(this.dispatchClientEvent)

    authEvents.on('new_token', this.setup)
  }

  dispatchSocketEvent = event => {
    this.emit(event.name, event.data, 'server')
  }

  dispatchClientEvent = (name: string, data: any, from: string) => {
    if (from === 'server') {
      // we sent this event ourselves
      return
    }

    const socket = this.guestSocket
    socket && socket.emit('event', { name, data })
  }

  deleteVisitorId = (userIdScope?: string) => {
    unsetVisitorId(userIdScope)
  }

  updateVisitorId = (userId: string, userIdScope?: string) => {
    setVisitorId(userId, userIdScope)
  }

  private updateVisitorSocketId() {
    window.__BP_VISITOR_SOCKET_ID = this.guestSocket.id
  }

  private deleteVisitorSocketId() {
    window.__BP_VISITOR_SOCKET_ID = undefined
  }

  setup = (userIdScope?: string) => {
    const query = {
      visitorId: getUniqueVisitorId(userIdScope)
    }

    if (this.guestSocket) {
      this.guestSocket.off('event', this.dispatchSocketEvent)
      this.guestSocket.off('connect', this.updateVisitorSocketId)

      this.guestSocket.disconnect()

      this.deleteVisitorSocketId()
    }

    const socketUrl = window['BP_SOCKET_URL'] || window.location.origin
    const transports = window.SOCKET_TRANSPORTS

    this.guestSocket = io(`${socketUrl}/guest`, { query, transports, path: `${window['ROOT_PATH']}/socket.io` })

    this.guestSocket.on('connect', this.updateVisitorSocketId.bind(this))
    this.guestSocket.on('event', this.dispatchSocketEvent)
  }
}

EventBus.default = new EventBus()

export default EventBus
