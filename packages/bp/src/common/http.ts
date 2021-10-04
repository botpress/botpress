import { Logger, StrategyUser } from 'botpress/sdk'
import { NextFunction, Request, Response } from 'express'

import { TokenUser } from './typings'
import { getErrorMessage } from './utils'

// This method is only used for basic escaping of error messages, do not use for page display
const escapeHtmlSimple = (str: string) => {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;')
}

const URL_FOLDER_SEPERATOR = '!!'

export const encodeFolderPath = (path: string): string => {
  return path.replace(/\//g, URL_FOLDER_SEPERATOR)
}

export const decodeFolderPath = (urlPath: string): string => {
  return urlPath.replace(new RegExp(URL_FOLDER_SEPERATOR, 'g'), '/')
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
  constructor(message: string, detailedMessage?: unknown) {
    super(`${message}: ${getErrorMessage(detailedMessage)}`, 400)
    this.skipLogging = true
  }

  type = 'StandardError'
}

export class UnexpectedError extends ResponseError {
  constructor(message: string, detailedMessage?: unknown) {
    super(`${message}: ${getErrorMessage(detailedMessage)}`, 400)
  }

  type = 'UnexpectedError'
}

export class UnauthorizedError extends ResponseError {
  constructor(message: string) {
    super(`Unauthorized: ${message}`, 401)
  }

  type = 'UnauthorizedError'
}

// TODO: Move other ResponseError from routers to this file
