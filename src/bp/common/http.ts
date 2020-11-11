import { Logger, StrategyUser } from 'botpress/sdk'
import { NextFunction, Request, Response } from 'express'

import { TokenUser } from './typings'

// This method is only used for basic escaping of error messages, do not use for page display
const escapeHtmlSimple = (str: string) => {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;')
}

export type BPRequest = Request & {
  authUser: StrategyUser | undefined
  tokenUser: TokenUser | undefined
  credentials: any | undefined
  workspace?: string
}

export type AsyncMiddleware = (
  fn: (req: BPRequest, res: Response, next?: NextFunction | undefined) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => void

export const asyncMiddleware = (logger: Logger, routerName?: string): AsyncMiddleware => fn => (req, res, next) => {
  Promise.resolve(fn(req as BPRequest, res, next)).catch(err => {
    if (typeof err === 'string') {
      err = {
        skipLogging: false,
        message: err
      }
    }

    err.router = routerName
    if (!err.skipLogging && !process.IS_PRODUCTION) {
      const botId = err.botId || req.params.botId

      if (!botId) {
        logger.attachError(err).debug(`[${routerName || 'api'}]`)
      } else {
        logger
          .forBot(botId)
          .attachError(err)
          .debug(`[${botId}]`)
      }
    }

    next(err)
  })
}

/**
 * The object that wraps HTTP errors.
 *
 * @constructor
 * @param message - The error message that will be sent to the end-user
 * @param statusCode - The HTTP status code
 * @param errorCode - Botpress error codes e.g. BP_0001, BP_0002, etc.
 */
export class ResponseError extends Error {
  errorCode: string | undefined
  statusCode: number

  skipLogging = false

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(escapeHtmlSimple(message))
    Error.captureStackTrace(this, this.constructor)
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

/**
 * A standard error, which doesn't print stack traces, but return an error message to the user
 */
export class StandardError extends ResponseError {
  type = 'StandardError'

  constructor(message: string, detailedMessage?: string) {
    super([message, detailedMessage].filter(Boolean).join(': '), 400)
    this.skipLogging = true
  }
}

export class BadRequestError extends ResponseError {
  type = 'BadRequestError'

  constructor(message?: string) {
    super(['Bad Request', message].filter(Boolean).join(': '), 400, 'BP_0040')
  }
}

export class UnauthorizedError extends ResponseError {
  type = 'UnauthorizedError'

  constructor(message?: string) {
    super(['Unauthorized', message].filter(Boolean).join(': '), 401, 'BP_0041')
  }
}

export class PaymentRequiredError extends ResponseError {
  type = 'PaymentRequiredError'

  constructor(message?: string) {
    super(['Payment Required', message].filter(Boolean).join(': '), 402, 'BP_0042')
  }
}

export class ForbiddenError extends ResponseError {
  type = 'ForbiddenError'

  constructor(message?: string) {
    super(['Forbidden', message].filter(Boolean).join(': '), 403, 'BP_0043')
  }
}

export class NotFoundError extends ResponseError {
  type = 'NotFoundError'

  constructor(message?: string) {
    super(['Not Found', message].filter(Boolean).join(': '), 404, 'BP_0044')
  }
}

export class ConflictError extends ResponseError {
  type = 'ConflictError'

  constructor(message?: string) {
    super(['Conflict', message].filter(Boolean).join(': '), 409, 'BP_0049')
  }
}

export class UnprocessableEntityError extends ResponseError {
  type = 'UnprocessableEntity'

  constructor(message?: string) {
    super(['Unprocessable Entity', message].filter(Boolean).join(': '), 422)
  }
}

export class InternalServerError extends ResponseError {
  type = 'InternalServerError'

  constructor(message?: string) {
    super(['Internal Server Error', message].filter(Boolean).join(': '), 500, 'BP_0050')
  }
}

export class ServiceUnavailableError extends ResponseError {
  type = 'ServiceUnavailableError'

  constructor(message?: string) {
    super(['Service Unavailable', message].filter(Boolean).join(': '), 503, 'BP_0140')
  }
}
