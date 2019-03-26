import { Logger, RealTimePayload } from 'botpress/sdk'
import { EventEmitter2 } from 'eventemitter2'
import { Server } from 'http'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import socketio from 'socket.io'
import redisAdapter from 'socket.io-redis'
import socketioJwt from 'socketio-jwt'

import { TYPES } from '../../types'
import { MonitoringService } from '../monitoring'

const debug = DEBUG('realtime')

@injectable()
export default class RealtimeService {
  private readonly ee: EventEmitter2
  private useRedis: boolean

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Realtime')
    private logger: Logger /* TODO Add security / auth service here */,
    @inject(TYPES.MonitoringService) private monitoringService: MonitoringService
  ) {
    this.ee = new EventEmitter2({
      wildcard: true,
      maxListeners: 100
    })

    this.useRedis = process.CLUSTER_ENABLED && Boolean(process.env.REDIS_URL)
  }

  private isEventTargeted(eventName: string | string[]): boolean {
    if (_.isArray(eventName)) {
      eventName = eventName[0]
    }

    return (eventName as string).startsWith('guest.')
  }

  sendToSocket(payload: RealTimePayload) {
    debug('Send payload', payload)
    this.ee.emit(payload.eventName, payload.payload, 'server')
  }

  installOnHttpServer(server: Server) {
    const io = socketio(server, {
      transports: ['websocket', 'polling'],
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
    const guest = io.of('/guest')

    // TODO Implement that
    // Only admin UI users requests are authenticated
    admin.use(
      socketioJwt.authorize({
        secret: process.APP_SECRET,
        handshake: true
      })
    )

    admin.on('connection', socket => {
      const visitorId = _.get(socket, 'handshake.query.visitorId')
      // bp.stats.track('socket', 'connected') // TODO/FIXME Add tracking

      socket.on('event', event => {
        this.ee.emit(event.name, event.data, 'client', {
          visitorId: visitorId,
          socketId: socket.id,
          guest: false,
          admin: true
        })
      })
    })

    guest.on('connection', socket => {
      const visitorId = _.get(socket, 'handshake.query.visitorId')
      // bp.stats.track('socket', 'connected') // TODO/FIXME Add tracking

      if (visitorId && visitorId.length > 0) {
        if (this.useRedis) {
          guest.adapter.remoteJoin(socket.id, 'visitor:' + visitorId, err => {
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
        this.ee.emit(event.name, event.data, 'client', {
          socketId: socket.id,
          visitorId: visitorId,
          guest: true,
          admin: false
        })
      })
    })

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

      // TODO FIXME There's a flaw here, guests can send admin events (!)

      // broadcast event to the front-end clients
      connection.emit('event', {
        name: event,
        data: payload
      })
    })
  }
}
