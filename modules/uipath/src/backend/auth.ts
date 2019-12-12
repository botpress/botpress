import jsonwebtoken from 'jsonwebtoken'

import { UnauthorizedError } from './error'

export const jwtAuthorizerMiddleware = async (req, res, next) => {
  if (!req.headers.authorization) {
    return next(new UnauthorizedError('Authorization header is missing'))
  }

  const [scheme, token] = req.headers.authorization.split(' ')
  if (scheme.toLowerCase() !== 'bearer') {
    return next(new UnauthorizedError(`Unknown scheme "${scheme}"`))
  }

  if (!token) {
    return next(new UnauthorizedError('Authentication token is missing'))
  }

  try {
    jsonwebtoken.verify(token, process.APP_SECRET)
  } catch (err) {
    return next(new UnauthorizedError('Invalid authentication token'))
  }

  next()
}
