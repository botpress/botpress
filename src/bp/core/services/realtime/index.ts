import { Logger, RealTimePayload } from 'botpress/sdk'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { EventEmitter2 } from 'eventemitter2'
import { Server } from 'http'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import socketio, { Adapter } from 'socket.io'
import redisAdapter from 'socket.io-redis'
import socketioJwt from 'socketio-jwt'

import { TYPES } from '../../types'
import { MonitoringService } from '../monitoring'

const debug = DEBUG('realtime')

export const getSocketTransports = (config: BotpressConfig): string[] => {
  // Just to be sure there is at least one valid transport configured
  const transports = _.filter(config.httpServer.socketTransports, t => ['websocket', 'polling'].includes(t))
  return transports && transports.length ? transports : ['websocket', 'polling']
}

interface RedisAdapter extends Adapter {
  remoteJoin: (socketId: string, roomId: string, callback: (err: any) => void) => void
}

@injectable()
export default class RealtimeService {
  private readonly ee: EventEmitter2
  private useRedis: boolean

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Realtime')
    private logger: Logger,
    @inject(TYPES.MonitoringService) private monitoringService: MonitoringService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {
    this.ee = new EventEmitter2({
      wildcard: true,
      maxListeners: 100
    })

    this.useRedis = process.CLUSTER_ENABLED && Boolean(process.env.REDIS_URL) && process.IS_PRO_ENABLED
  }

  private isEventTargeted(eventName: string | string[]): boolean {
    if (_.isArray(eventName)) {
      eventName = eventName[0]
    }

    return (eventName as string).startsWith('guest.')
  }

  sendToSocket(payload: RealTimePayload) {
    debug('Send %o', payload)
    this.ee.emit(payload.eventName, payload.payload, 'server')
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

  setupAdminSocket(admin: socketio.Namespace): void {
    admin.use(socketioJwt.authorize({ secret: process.APP_SECRET, handshake: true }))
    admin.on('connection', socket => {
      const visitorId = _.get(socket, 'handshake.query.visitorId')

      socket.on('event', event => {
        try {
          if (!event || !event.name) {
            return
          }

          this.ee.emit(event.name, event.data, 'client', {
            visitorId: visitorId,
            socketId: socket.id,
            guest: false,
            admin: true
          })
        } catch (err) {
          this.logger.attachError(err).error(`Error processing incoming admin event`)
        }
      })
    })
  }

  setupGuestSocket(guest: socketio.Namespace): void {
    guest.on('connection', socket => {
      const visitorId = _.get(socket, 'handshake.query.visitorId')

      if (visitorId && visitorId.length > 0) {
        if (this.useRedis) {
          const adapter = guest.adapter as RedisAdapter
          adapter.remoteJoin(socket.id, 'visitor:' + visitorId, err => {
            if (err) {
              return this.logger
                .attachError(err)
                .error(`socket "${socket.id}" for visitor "${visitorId}" can't join the socket.io redis room`)
            }
          })
        } else {
          socket.join('visitor:' + visitorId)
        }
      }

      socket.on('event', event => {
        try {
          if (!event || !event.name) {
            return
          }

          this.ee.emit(event.name, event.data, 'client', {
            socketId: socket.id,
            visitorId: visitorId,
            guest: true,
            admin: false
          })
        } catch (err) {
          this.logger.attachError(err).error(`Error processing incoming guest event`)
        }
      })
    })
  }
}
