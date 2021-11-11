/**
 * Mostly copied from https://github.com/auth0-community/auth0-socketio-jwt/
 * which is deprecated since september 2021 (https://community.auth0.com/t/community-repo-deprecations-september-2021-eol/60380)
 */

import jwt, { VerifyErrors } from 'jsonwebtoken'
import Socket from 'socket.io'

export class UnauthorizedError extends Error {
  private data: { message: string; code: string; type: 'UnauthorizedError' }

  constructor(code: string, message: string) {
    super(message)

    this.message = message
    this.data = {
      message: this.message,
      code,
      type: 'UnauthorizedError'
    }
  }
}

interface Options {
  callback?: false | number
  secret: string
  handshake?: boolean
  required?: boolean
  timeout?: number
}

const DEFAULT_AUTHENTICATION_TIMEOUT = 5000
const DECODED_PROPERTY_NAME = 'decoded_token'

const noQsMethod = (options: Options) => {
  options = { required: true, ...options }

  return (socket: Socket.Socket) => {
    const server: Socket.Server = socket['server']
    let authTimeout: ReturnType<typeof setTimeout>

    if (options.required) {
      authTimeout = setTimeout(() => {
        socket.disconnect()
      }, options.timeout || DEFAULT_AUTHENTICATION_TIMEOUT)
    }

    socket.on('authenticate', (data: any) => {
      if (options.required) {
        clearTimeout(authTimeout)
      }

      const onError = function(code: string, err: string) {
        if (err) {
          const error = new UnauthorizedError(code || 'unknown', err)
          let callbackTimeout: ReturnType<typeof setTimeout>

          // If callback explicitly set to false, start timeout to disconnect socket
          if (options.callback === false || typeof options.callback === 'number') {
            if (typeof options.callback === 'number') {
              if (options.callback < 0) {
                // If callback is negative(invalid value), make it positive
                options.callback = Math.abs(options.callback)
              }
            }

            callbackTimeout = setTimeout(
              () => {
                socket.disconnect()
              },
              options.callback === false ? 0 : options.callback
            )
          }

          socket.emit('unauthorized', error, () => {
            if (typeof options.callback === 'number') {
              clearTimeout(callbackTimeout)
            }
            socket.disconnect()
          })

          return
        }
      }

      if (!data || typeof data.token !== 'string') {
        return onError('invalid_token', 'invalid token datatype')
      }

      try {
        const decoded = jwt.verify(data.token, options.secret)

        socket[DECODED_PROPERTY_NAME] = decoded
        socket.emit('authenticated')

        // Try getting the current namespace otherwise fallback to all sockets.
        const namespace: Socket.Namespace = server._nsps?.[socket.nsp?.name] || server.sockets

        namespace.emit('authenticated', socket)
      } catch (err) {
        return onError('invalid_token', (err as VerifyErrors).message)
      }
    })
  }
}

function authorize(options: Options): (socket: Socket.Socket, fn: (err?: any) => void) => void {
  if (!options.handshake) {
    return noQsMethod(options)
  }

  return (socket, next) => {
    const req = socket.request
    const authorizationHeader = req.headers.authorization
    const handshakeAuth = socket.handshake.auth

    let token: string = ''

    if (authorizationHeader) {
      const parts = authorizationHeader.split(' ')
      if (parts.length === 2) {
        const scheme = parts[0]
        const credentials = parts[1]

        if (scheme.toLowerCase() === 'bearer') {
          token = credentials
        }
      } else {
        const error = new UnauthorizedError('credentials_bad_format', 'Format is Authorization: Bearer [token]')
        return next(error)
      }
    }

    if (handshakeAuth.token) {
      token = handshakeAuth.token
    }

    if (!token) {
      const error = new UnauthorizedError('credentials_required', 'No Authorization header was found')
      return next(error)
    }

    try {
      const decoded = jwt.verify(token, options.secret)

      socket[DECODED_PROPERTY_NAME] = decoded

      return next()
    } catch (err) {
      const error = new UnauthorizedError('invalid_token', (err as VerifyErrors).message)
      return next(error)
    }
  }
}

export default {
  authorize
}
