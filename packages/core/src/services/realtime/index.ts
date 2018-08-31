import { Logger } from 'botpress-module-sdk'
import { EventEmitter2 } from 'eventemitter2'
import { Server } from 'http'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import socketio from 'socket.io'
import socketioJwt from 'socketio-jwt'

import { TYPES } from '../../misc/types'

@injectable()
export default class RealtimeService {
  private readonly ee: EventEmitter2

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Realtime')
    private logger: Logger /* TODO Add security / auth service here */
  ) {
    this.ee = new EventEmitter2({
      wildcard: true,
      maxListeners: 100
    })
  }

  private isEventTargeted(eventName: string | string[]): boolean {
    if (_.isArray(eventName)) {
      eventName = eventName[0]
    }

    return (eventName as string).startsWith('guest.')
  }

  installOnHttpServer(server: Server) {
    const io = socketio(server, {
      // transports: ['polling'],
      origins: '*:*'
      // serveClient: false
    })
    const admin = io.of('/admin')
    const guest = io.of('/guest')

    // TODO Implement that
    // Only admin UI users requests are authenticated

    // if (bp.botfile.login.enabled) {
    //   admin.use(
    //     socketioJwt.authorize({
    //       secret: await bp.security.getJWTSecretOrCertificate(),
    //       handshake: true
    //     })
    //   )
    // }

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
        socket.join('visitor:' + visitorId)
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

    this.ee.onAny((event, data, from) => {
      if (from === 'client') {
        return // we sent this ourselves
      }

      const connection = this.isEventTargeted(event) ? guest : admin

      if (data && (data.__socketId || data.__room)) {
        // Send only to this socketId or room
        return connection.to(data.__socketId || data.__room).emit('event', {
          name: event,
          data: data
        })
      }

      // TODO FIXME There's a flaw here, guests can send admin events (!)

      // broadcast event to the front-end clients
      connection.emit('event', {
        name: event,
        data: data
      })
    })

    this.logger.info('Started')
  }
}
