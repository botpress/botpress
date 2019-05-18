import { Logger } from 'botpress/sdk'
import { checkRule } from 'common/auth'
import { WorkspaceService } from 'core/services/workspace-service'
import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import onHeaders from 'on-headers'

import { AuthUser, RequestWithUser, TokenUser } from '../misc/interfaces'
import { SERVER_USER } from '../server'
import AuthService from '../services/auth/auth-service'
import { incrementMetric } from '../services/monitoring'

import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  PaymentRequiredError,
  UnauthorizedError
} from './errors'

const debugFailure = DEBUG('audit:collab:fail')
const debugSuccess = DEBUG('audit:collab:success')
const debugSuperSuccess = DEBUG('audit:admin:success')
const debugSuperFailure = DEBUG('audit:admin:fail')

export type BPRequest = Request & {
  authUser: AuthUser | undefined
  tokenUser: TokenUser | undefined
  credentials: any | undefined
}

export type AsyncMiddleware = (
  fn: (req: BPRequest, res: Response, next?: NextFunction | undefined) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => void

export const asyncMiddleware = (logger: Logger, routerName: string): AsyncMiddleware => fn => (req, res, next) => {
  Promise.resolve(fn(req as BPRequest, res, next)).catch(err => {
    err.router = routerName
    if (!err.skipLogging && !process.IS_PRODUCTION) {
      logger.attachError(err).debug(`[${routerName}] Async request error ${err.message}`)
    }

    next(err)
  })
}

export const monitoringMiddleware = (req, res, next) => {
  const startAt = Date.now()

  onHeaders(res, () => {
    const timeInMs = Date.now() - startAt
    incrementMetric('requests.count')
    incrementMetric('requests.latency_sum', timeInMs)
    res.setHeader('X-Response-Time', `${timeInMs}ms`)
  })

  next()
}

export const validateRequestSchema = (property: string, req: Request, schema: Joi.AnySchema) => {
  const result = Joi.validate(req[property], schema)

  if (result.error) {
    throw new BadRequestError(result.error.message)
  }

  Object.assign(req[property], result.value)
}

export const validateBodySchema = (req: Request, schema: Joi.AnySchema) => validateRequestSchema('body', req, schema)

export const success = (res: Response, message: string = 'Success', payload = {}) => {
  res.json({
    status: 'success',
    message,
    payload
  })
}

export const checkTokenHeader = (authService: AuthService, audience?: string) => async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
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
    const tokenUser = await authService.checkToken(token, audience)

    if (!tokenUser) {
      return next(new UnauthorizedError('Invalid authentication token'))
    }

    req.tokenUser = tokenUser
  } catch (err) {
    return next(new UnauthorizedError('Invalid authentication token'))
  }

  next()
}

export const loadUser = (authService: AuthService) => async (req: Request, res: Response, next: Function) => {
  const reqWithUser = <RequestWithUser>req
  const { tokenUser } = reqWithUser
  if (!tokenUser) {
    return next(new InternalServerError('No tokenUser in request'))
  }

  const authUser = await authService.findUserByEmail(tokenUser.email)
  if (!authUser) {
    return next(new UnauthorizedError('Unknown user'))
  }

  reqWithUser.authUser = authUser
  next()
}

export const assertSuperAdmin = (req: Request, res: Response, next: Function) => {
  const { tokenUser } = <RequestWithUser>req
  if (!tokenUser) {
    debugSuperFailure(`${req.originalUrl} %o`, {
      method: req.method,
      ip: req.ip
    })
    return next(new InternalServerError('No tokenUser in request'))
  }

  if (!tokenUser.isSuperAdmin) {
    debugSuperFailure(`${req.originalUrl} %o`, {
      method: req.method,
      ip: req.ip,
      user: tokenUser
    })
    return next(new ForbiddenError('User needs to be super admin to perform this action'))
  }

  debugSuperSuccess(`${req.originalUrl} %o`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: tokenUser
  })

  next()
}

export const assertBotpressPro = (workspaceService: WorkspaceService) => async (
  _req: RequestWithUser,
  _res: Response,
  next: NextFunction
) => {
  if (!process.IS_PRO_ENABLED || !process.IS_LICENSED) {
    const workspace = await workspaceService.getWorkspace()
    // Allow to create the first user
    if (workspace.users.length > 0) {
      return next(new PaymentRequiredError('Botpress Pro is required to perform this action'))
    }
  }

  return next()
}

export const needPermissions = (workspaceService: WorkspaceService) => (operation: string, resource: string) => async (
  req: RequestWithUser,
  _res: Response,
  next: NextFunction
) => {
  const email = req.tokenUser && req.tokenUser!.email
  // The server user is used internally, and has all the permissions
  if (email === SERVER_USER) {
    return next()
  }

  const user = await workspaceService.findUser({ email })

  if (!user) {
    debugFailure(`${req.originalUrl} %o`, {
      method: req.method,
      email,
      operation,
      resource,
      ip: req.ip
    })
    return next(new NotFoundError(`User "${email}" does not exists`))
  }

  const role = await workspaceService.getRoleForUser(req.tokenUser!.email)

  if (!role || !checkRule(role.rules, operation, resource)) {
    debugFailure(req.originalUrl, {
      method: req.method,
      email,
      operation,
      resource,
      userRole: role && role.id,
      ip: req.ip
    })
    return next(
      new ForbiddenError(`user does not have sufficient permissions to "${operation}" on ressource "${resource}"`)
    )
  }

  debugSuccess(`${req.originalUrl} %o`, {
    method: req.method,
    email,
    operation,
    resource,
    userRole: role && role.id,
    ip: req.ip
  })

  next()
}
