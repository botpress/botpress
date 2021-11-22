// import { Request } from 'express-serve-static-core'
import * as sdk from 'botpress/runtime-sdk'
import { NextFunction, Request, Response, Router } from 'express'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

const debug = DEBUG('api')
const debugRequest = debug.sub('request')

export const debugRequestMw = (req: Request, _res, next) => {
  debugRequest(`${req.path} %o`, {
    method: req.method,
    ip: req.ip,
    originalUrl: req.originalUrl
  })

  next()
}

export type AsyncMiddleware = (
  fn: (req: any, res: Response, next?: NextFunction | undefined) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => void

export const asyncMiddleware = (logger: any, routerName: string): AsyncMiddleware => fn => (req, res, next) => {
  Promise.resolve(fn(req as any, res, next)).catch(err => {
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

export abstract class CustomRouter {
  protected readonly asyncMiddleware: AsyncMiddleware
  public readonly router: Router
  constructor(name: string, logger: sdk.Logger, router: Router) {
    this.asyncMiddleware = asyncMiddleware(logger, name)
    this.router = router
  }
}
