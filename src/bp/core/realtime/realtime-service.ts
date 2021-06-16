import { Logger } from 'botpress/sdk'
import cookie from 'cookie'
import { TYPES } from 'core/app/types'
import { BotpressConfig, ConfigProvider } from 'core/config'
import { MonitoringService } from 'core/health'
import { PersistedConsoleLogger } from 'core/logger'
import { AuthService } from 'core/security'
import { EventEmitter2 } from 'eventemitter2'
import { Server } from 'http'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import socketio, { Adapter } from 'socket.io'
import redisAdapter from 'socket.io-redis'
import socketioJwt from 'socketio-jwt'
import { RealTimePayload } from './payload-sdk-impl'

const debug = DEBUG('realtime')

export const getSocketTransports = (config: BotpressConfig): string[] => {
  // Just to be sure there is at least one valid transport configured
  const transports = _.filter(config.httpServer.socketTransports, t => ['websocket', 'polling'].includes(t))
  return transports && transports.length ? transports : ['websocket', 'polling']
}

interface RedisAdapter extends Adapter {
  remoteJoin: (socketId: string, roomId: string, callback: (err: any) => void) => void
  allRooms: (callback: (err: Error, rooms: string[]) => void) => void
  clientRooms: (socketId: string, callback: (err: Error, rooms: string[]) => void) => void
}

@injectable()
export class RealtimeService {
  private readonly ee: EventEmitter2
  private useRedis: boolean
  private guest?: socketio.Namespace

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Realtime')
    private logger: Logger,
    @inject(TYPES.MonitoringService) private monitoringService: MonitoringService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.AuthService) private authService: AuthService
  ) {
    this.ee = new EventEmitter2({
      wildcard: true,
      maxListeners: 100
    })

    this.useRedis = process.CLUSTER_ENABLED && Boolean(process.env.REDIS_URL) && process.IS_PRO_ENABLED

    PersistedConsoleLogger.LogStreamEmitter.onAny((type, level, message, args) => {
      this.sendToSocket(RealTimePayload.forAdmins(type as string, { level, message, args }))
    })
  }

  private isEventTargeted(eventName: string | string[]): boolean {
    if (_.isArray(eventName)) {
      eventName = eventName[0]
    }

    return (eventName as string).startsWith('guest.')
  }

  private makeVisitorRoomId(visitorId: string): string {
    return `visitor:${visitorId}`
  }

  private unmakeVisitorId(roomId: string): string {
    return roomId.split(':')[1]
  }

  sendToSocket(payload: RealTimePayload) {
    debug('Send %o', payload)
    this.ee.emit(payload.eventName, payload.payload, 'server')
  }

  async getVisitorIdFromSocketId(socketId: string): Promise<undefined | string> {
    let rooms: string[]
    try {
      if (this.useRedis) {
        const adapter = this.guest?.adapter as RedisAdapter
        rooms = await Promise.fromCallback(cb => adapter.clientRooms(socketId, cb))
      } else {
        rooms = Object.keys(this.guest?.adapter.sids[socketId] ?? {})
      }
    } catch (err) {
      rooms = []
    }

    // rooms here contains one being socketId and all rooms in which user is connected
    // in the "guest" case it's a single room being the webchat and corresponds to the visitor id
    // resulting wo something like ["/guest:lijasdioajwero", "visitor:kas9d2109das0"]
    const roomId = rooms.filter(x => x !== socketId)[0]
    return roomId ? this.unmakeVisitorId(roomId) : undefined
  }

  async installOnHttpServer(server: Server) {
    const transports = getSocketTransports(await this.configProvider.getBotpressConfig())

    const io: socketio.Server = socketio(server, {
      transports,
      path: `${process.ROOT_PATH}/socket.io`,
      origins: '*:*',
      serveClient: false
    })

    if (this.useRedis) {
      const redisFactory = this.monitoringService.getRedisFactory()

      if (redisFactory) {
        io.adapter(redisAdapter({ pubClient: redisFactory('commands'), subClient: redisFactory('socket') }))
      }
    }

    const admin = io.of('/admin')
    this.setupAdminSocket(admin)

    const guest = io.of('/guest')
    this.setupGuestSocket(guest)

    this.ee.onAny((event, payload, from) => {
      if (from === 'client') {
        return // This is coming from the client, we don't send this event back to them
      }

      const connection = this.isEventTargeted(event) ? guest : admin

      if (payload && (payload.__socketId || payload.__room)) {
        // Send only to this socketId or room
        return connection.to(payload.__socketId || payload.__room).emit('event', {
          name: event,
          data: payload
        })
      }

      // broadcast event to the front-end clients
      connection.emit('event', { name: event, data: payload })
    })
  }

  checkCookieToken = async (socket: socketio.Socket, fn: (err?) => any) => {
    try {
      const csrfToken = socket.handshake.query.token
      const { jwtToken } = cookie.parse(socket.handshake.headers.cookie)

      if (jwtToken && csrfToken) {
        await this.authService.checkToken(jwtToken, csrfToken)
        fn(undefined)
      }

      fn('Mandatory parameters are missing')
    } catch (err) {
      fn(err)
    }
  }

  setupAdminSocket(admin: socketio.Namespace): void {
    if (process.USE_JWT_COOKIES) {
      admin.use(this.checkCookieToken)
    } else {
      admin.use(socketioJwt.authorize({ secret: process.APP_SECRET, handshake: true }))
    }

    admin.on('connection', socket => {
      const visitorId = _.get(socket, 'handshake.query.visitorId')

      socket.on('event', event => {
        try {
          if (!event || !event.name) {
            return
          }

          this.ee.emit(event.name, event.data, 'client', {
            visitorId,
            socketId: socket.id,
            guest: false,
            admin: true
          })
        } catch (err) {
          this.logger.attachError(err).error('Error processing incoming admin event')
        }
      })
    })
  }

  setupGuestSocket(guest: socketio.Namespace): void {
    this.guest = guest
    guest.on('connection', socket => {
      const visitorId = _.get(socket, 'handshake.query.visitorId')

      if (visitorId && visitorId.length > 0) {
        const roomId = this.makeVisitorRoomId(visitorId)
        if (this.useRedis) {
          const adapter = guest.adapter as RedisAdapter
          adapter.remoteJoin(socket.id, roomId, err => {
            if (err) {
              return this.logger
                .attachError(err)
                .error(`socket "${socket.id}" for visitor "${visitorId}" can't join the socket.io redis room`)
            }
          })
        } else {
          socket.join(roomId)
        }
      }

      socket.on('event', event => {
        try {
          if (!event || !event.name) {
            return
          }

          this.ee.emit(event.name, event.data, 'client', {
            socketId: socket.id,
            visitorId,
            guest: true,
            admin: false
          })
        } catch (err) {
          this.logger.attachError(err).error('Error processing incoming guest event')
        }
      })
    })
  }
}
