import { Request } from 'express'
import _ from 'lodash'

import { UnauthorizedError } from './core/routers/errors'

const debugAuth = DEBUG('api:auth')

export const isAdminToken = (req, adminToken: string) => {
  if (!adminToken || !adminToken.length) {
    return true
  }
  if (!req.headers.authorization) {
    return false
  }
  const [, token] = req.headers.authorization.split(' ')
  return token === adminToken
}

export const authMiddleware = (secureToken: string, secondToken?: string) => (req, _res, next) => {
  if (!secureToken || !secureToken.length) {
    return next()
  }

  if (!req.headers.authorization) {
    debugAuth('Authorization header missing', { ip: req.ip })
    return next(new UnauthorizedError('Authorization header is missing'))
  }

  const [scheme, token] = req.headers.authorization.split(' ')
  if (scheme.toLowerCase() !== 'bearer') {
    debugAuth('Schema is missing', { ip: req.ip })
    return next(new UnauthorizedError(`Unknown scheme "${scheme}" - expected 'bearer <token>'`))
  }

  if (!token) {
    debugAuth('Token is missing', { ip: req.ip })
    return next(new UnauthorizedError('Authentication token is missing'))
  }

  if (secureToken !== token && secondToken !== token) {
    debugAuth('Invalid token', { ip: req.ip })
    return next(new UnauthorizedError('Invalid Bearer token'))
  }

  next()
}

export const disabledReadonlyMiddleware = (readonly: boolean) => (_req, _res, next) => {
  if (readonly) {
    return next(new UnauthorizedError('API server is running in read-only mode'))
  }

  next()
}

export const handleUnexpectedError = (err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const errorCode = err.errorCode || 'BP_000'
  const message = (err.errorCode && err.message) || 'Unexpected error'

  res.status(statusCode).json({
    statusCode,
    errorCode,
    type: err.type || Object.getPrototypeOf(err).name || 'Exception',
    message
  })
}

export const handleErrorLogging = (err, req, res, next) => {
  if (err && (err.skipLogging || process.env.SKIP_LOGGING)) {
    return res.status(err.statusCode).send(err.message)
  }

  next(err)
}

export type RequestWithLang = Request & {
  language?: string
}
