import { Logger, StrategyUser } from 'botpress/sdk'
import { RequestWithUser, TokenUser } from 'common/typings'
import { incrementMetric } from 'core/health'
import { asBytes } from 'core/misc/utils'
import { AuthService } from 'core/security'
import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import mime from 'mime-types'
import multer from 'multer'
import onHeaders from 'on-headers'

import { BadRequestError, InternalServerError, UnauthorizedError } from './errors'

const debugFailure = DEBUG('audit:collab:fail')
const debugSuccess = DEBUG('audit:collab:success')
const debugSuperSuccess = DEBUG('audit:admin:success')
const debugSuperFailure = DEBUG('audit:admin:fail')

// TODO: Remove BPRequest, AsyncMiddleware and asyncMiddleware from this file

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
    if (typeof err === 'string') {
      err = {
        skipLogging: false,
        message: err
      }
    }

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

export const sendSuccess = <T extends {}>(res: Response, message: string = 'Success', payload?: T) => {
  res.json({
    status: 'success',
    message,
    payload: payload || {}
  })
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

/**
 * This method checks that uploaded file respects constraints
 * @example fileUploadMulter(['image/*', 'audio/mpeg'], '150mb)
 * fileUploadMulter(['*'], '1gb)
 */
export const fileUploadMulter = (allowedMimeTypes: string[] = [], maxFileSize?: string) => {
  const allowedMimeTypesRegex = allowedMimeTypes.map(mimeType => {
    // '*' is not a valid regular expression
    if (mimeType.includes('*')) {
      mimeType = mimeType.replace('*', '.*')
    }

    return new RegExp(mimeType, 'i')
  })

  return multer({
    fileFilter: (_req, file, cb) => {
      const extMimeType = mime.lookup(file.originalname) || ''
      if (
        allowedMimeTypesRegex.some(regex => regex.test(file.mimetype)) &&
        allowedMimeTypesRegex.some(regex => regex.test(extMimeType))
      ) {
        return cb(null, true)
      }

      if (!extMimeType) {
        cb(
          new Error(
            `The file has no extension: ${file.originalname}. To allow any kind of files, set the value of "allowedMimeTypes" to "['*']" in your botpress.config.json file.`
          )
        )
      } else {
        cb(new Error(`This type of file is not allowed: ${file.mimetype}`))
      }
    },
    limits: {
      fileSize: (maxFileSize && asBytes(maxFileSize)) || undefined
    }
  }).single('file')
}

export interface TypedRequest<T> extends Request {
  body: T
}

export interface TypedResponse<T> extends Response {
  send: (body: T) => TypedResponse<T>
}
