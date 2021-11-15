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
  secret: string
}

const DECODED_PROPERTY_NAME = 'decoded_token'

function authorize(options: Options): (socket: Socket.Socket, fn: (err?: any) => void) => void {
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
