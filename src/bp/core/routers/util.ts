import { Logger } from 'botpress/sdk'
import { checkRule } from 'common/auth'
import { StrategyUser } from 'core/repositories/strategy_users'
import { WorkspaceService } from 'core/services/workspace-service'
import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import onHeaders from 'on-headers'

import { RequestWithUser, TokenUser } from '../../common/typings'
import AuthService, { SERVER_USER, WORKSPACE_HEADER } from '../services/auth/auth-service'
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
  authUser: StrategyUser | undefined
  tokenUser: TokenUser | undefined
  credentials: any | undefined
  workspace?: string
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

export const success = <T extends {}>(res: Response, message: string = 'Success', payload?: T) => {
  res.json({
    status: 'success',
    message,
    payload: payload || {}
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
    req.workspace = req.headers[WORKSPACE_HEADER] as string
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

  const authUser = await authService.findUser(tokenUser.email, tokenUser.strategy)
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
    // Allow to create the first user
    if ((await workspaceService.getUniqueCollaborators()) > 0) {
      return next(new PaymentRequiredError('Botpress Pro is required to perform this action'))
    }
  }

  return next()
}

/**
 * This method checks if the user exists, if he has access to the requested workspace, and if his role
 * allows him to do the requested operation. No other security checks should be needed.
 */
export const needPermissions = (workspaceService: WorkspaceService) => (operation: string, resource: string) => async (
  req: RequestWithUser,
  _res: Response,
  next: NextFunction
) => {
  if (!req.tokenUser) {
    debugFailure(`${req.originalUrl} %o`, {
      method: req.method,
      email: 'n/a',
      operation,
      resource,
      ip: req.ip,
      reason: 'unauthenticated'
    })
    return next(new ForbiddenError(`Unauthorized`))
  }

  if (!req.workspace && req.params.botId) {
    req.workspace = await workspaceService.getBotWorkspaceId(req.params.botId)
  }

  const { email, strategy, isSuperAdmin } = req.tokenUser

  // The server user is used internally, and has all the permissions
  if (email === SERVER_USER || isSuperAdmin) {
    debugSuccess(`${req.originalUrl} %o`, {
      method: req.method,
      email,
      operation,
      resource,
      userRole: 'superAdmin',
      ip: req.ip
    })
    return next()
  }

  if (!email || !strategy || !req.workspace) {
    debugFailure(`${req.originalUrl} %o`, {
      method: req.method,
      email,
      operation,
      resource,
      ip: req.ip,
      reason: 'missing auth parameter'
    })
    return next(new NotFoundError(`Missing one of the required parameters: email, strategy or workspace`))
  }

  const user = await workspaceService.findUser(email, strategy, req.workspace)

  if (!user) {
    debugFailure(`${req.originalUrl} %o`, {
      method: req.method,
      email,
      operation,
      resource,
      ip: req.ip
    })
    return next(new ForbiddenError(`User "${email}" doesn't have access to workspace "${req.workspace}"`))
  }

  const role = await workspaceService.getRoleForUser(email, strategy, req.workspace)

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
