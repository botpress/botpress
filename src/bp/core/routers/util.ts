import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'

// TODO: generalize these errors and consolidate them with ~/Errors.ts
import { RequestWithUser } from '../misc/interfaces'
import AuthService from '../services/auth/auth-service'
import { AssertionError, ProcessingError, UnauthorizedAccessError } from '../services/auth/errors'
import TeamsService from '../services/auth/teams-service'
import { Logging } from 'bp/common'
import { checkRule } from 'bp/core/misc/auth'

export const asyncMiddleware = ({ logger }: { logger: Logging.Logger }) => (
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    logger.debug(`Async request error ${err.message}`, err.stack)
    next(err)
  })
}

export const validateRequestSchema = (property: string, req: Request, schema: Joi.AnySchema) => {
  const result = Joi.validate(req[property], schema)

  if (result.error) {
    throw new AssertionError(result.error.message)
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

export const error = (
  res: Response,
  status = 400,
  code: string | null,
  message: string | null,
  docs: string | null
) => {
  res.status(status).json({
    status: 'error',
    type: 'Error',
    code: code || status,
    message: message || 'Unknown error',
    docs: docs || 'https://botpress.io/docs'
  })
}

export const checkTokenHeader = (authService: AuthService, audience?: string) => async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers.authorization) {
    return next(new UnauthorizedAccessError('No Authorization header'))
  }

  const [scheme, token] = req.headers.authorization.split(' ')
  if (scheme.toLowerCase() !== 'bearer') {
    return next(new UnauthorizedAccessError(`Unknown scheme ${scheme}`))
  }

  if (!token) {
    return next(new UnauthorizedAccessError('Missing authentication token'))
  }

  try {
    const user = await authService.checkToken(token, audience)

    if (!user) {
      return next(new UnauthorizedAccessError('Invalid authentication token'))
    }

    req.user = user
  } catch (err) {
    return next(err)
  }

  next()
}

export const loadUser = (authService: AuthService) => async (req: Request, res: Response, next: Function) => {
  const reqWithUser = req as RequestWithUser
  const { user } = reqWithUser
  if (!user) {
    throw new ProcessingError('No user property in the request')
  }

  const dbUser = await authService.findUserById(user.id)

  if (!dbUser) {
    throw new UnauthorizedAccessError('Unknown user ID')
  }

  reqWithUser.dbUser = {
    ...dbUser,
    fullName: [dbUser.firstname, dbUser.lastname].filter(Boolean).join(' ')
  }

  next()
}

const getParam = (req: Request, name: string, defaultValue?: any) =>
  req.params[name] || req.body[name] || req.query[name]

class PermissionError extends AssertionError {
  constructor(message: string) {
    super('Permission check error: ' + message)
  }
}

export const needPermissions = (teamsService: TeamsService) => (operation: string, resource: string) => async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user && req.user.id

  if (userId == undefined) {
    next(new PermissionError('user is not authenticated'))
    return
  }

  const botId = getParam(req, 'botId')
  let teamId = getParam(req, 'teamId')

  if (!botId && !teamId) {
    next(new PermissionError('botId or teamId must be present on the request'))
    return
  }

  if (!teamId) {
    teamId = await teamsService.getBotTeam(botId!)
  }

  if (!teamId) {
    next(new PermissionError('botId or teamId must be present on the request'))
    return
  }

  const rules = await teamsService.getUserPermissions(userId, teamId)

  if (!checkRule(rules, operation, resource)) {
    next(new PermissionError(`user does not have sufficient permissions to ${operation} ${resource}`))
    return
  }

  next()
}
