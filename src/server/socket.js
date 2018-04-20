import _ from 'lodash'
import socketio from 'socket.io'
import socketioJwt from 'socketio-jwt'

module.exports = bp => {
  const install = async server => {
    const io = socketio(server)

    const admin = io.of('/admin')
    const guest = io.of('/guest')

    if (bp.botfile.login.enabled) {
      admin.use(
        socketioJwt.authorize({
          secret: await bp.security.getJWTSecretOrCertificate(),
          handshake: true
        })
      )
    }

    admin.on('connection', socket => {
      const visitorId = _.get(socket, 'handshake.query.visitorId')
      bp.stats.track('socket', 'connected')

      socket.on('event', event => {
        bp.events.emit(event.name, event.data, 'client', {
          visitorId: visitorId,
          socketId: socket.id,
          guest: false,
          admin: true
        })
      })
    })

    guest.on('connection', socket => {
      const visitorId = _.get(socket, 'handshake.query.visitorId')
      bp.stats.track('socket', 'connected')

      if (visitorId && visitorId.length > 0) {
        socket.join('visitor:' + visitorId)
      }

      socket.on('event', event => {
        bp.events.emit(event.name, event.data, 'client', {
          socketId: socket.id,
          visitorId: visitorId,
          guest: true,
          admin: false
        })
      })
    })

    bp.events.onAny((event, data, from) => {
      if (from === 'client') {
        return // we sent this ourselves
      }

      // TODO: use more meaningful name
      const c = event.startsWith('guest.') ? guest : admin

      if (data && (data.__socketId || data.__room)) {
        // Send only to this socketId or room
        return c.to(data.__socketId || data.__room).emit('event', {
          name: event,
          data: data
        })
      }

      // broadcast event to the front-end clients
      c.emit('event', {
        name: event,
        data: data
      })
    })
  }

  return { install }
}
