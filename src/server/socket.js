import socketio from 'socket.io'
import socketioJwt from 'socketio-jwt'

module.exports = bp => {

  async function install(server) {
    const io = socketio(server)

    if (bp.botfile.login.enabled) {
      io.use(socketioJwt.authorize({
        secret: await bp.security.getSecret(),
        handshake: true
      }))
    }

    io.on('connection', function(socket) {
      bp.stats.track('socket', 'connected')

      socket.on('event', function(event) {
        bp.events.emit(event.name, event.data, 'client')
      })
    })

    bp.events.onAny(function(event, data, from) {
      if (from === 'client') {
        return // we sent this ourselves
      }

      // broadcast event to the front-end clients
      io.emit('event', {
        name: event,
        data: data
      })
    })
  }

  return { install }
}
