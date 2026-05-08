import { isNode } from 'browser-or-node'
import http from 'http'
import https from 'https'
import type { Duplex } from 'stream'

const _100mb = 100 * 1024 * 1024

export const maxBodyLength = _100mb
export const maxContentLength = _100mb

// With keepAlive pooling, an aborted request (e.g. axios timeout) can leave a
// libuv WriteWrap in flight. Its completion callback fires asynchronously
// after axios has already settled and the caller's `.catch()` has run, emitting
// `'error'` on the socket. With no listener on the socket itself the event has
// no consumer and Node converts it into an `uncaughtException` — crashing the
// process despite a correctly handled Promise rejection. Attaching a noop
// listener at `createConnection` time provides a safety net for these late
// secondary events; the Promise rejection still flows to callers normally.
const silenceLateSocketErrors = (socket: Duplex): Duplex => {
  socket.on('error', () => {})
  return socket
}

class SocketSafeHttpAgent extends http.Agent {
  public override createConnection(
    options: http.ClientRequestArgs,
    callback?: (err: Error | null, stream: Duplex) => void
  ): Duplex {
    return silenceLateSocketErrors(super.createConnection(options, callback))
  }
}

class SocketSafeHttpsAgent extends https.Agent {
  public override createConnection(
    options: http.ClientRequestArgs,
    callback?: (err: Error | null, stream: Duplex) => void
  ): Duplex {
    return silenceLateSocketErrors(super.createConnection(options, callback))
  }
}

export const httpAgent =
  isNode && http && http.Agent ? new SocketSafeHttpAgent({ keepAlive: true }) : undefined
export const httpsAgent =
  isNode && https && https.Agent ? new SocketSafeHttpsAgent({ keepAlive: true }) : undefined
