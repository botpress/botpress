import { Request, Response } from 'express'
import Joi from 'joi'

import { Logger } from '../../misc/interfaces'
// TODO: generalize these errors and consolidate them with ~/Errors.ts
import { AssertionError } from '../../services/auth/errors'

export const asyncMiddleware = ({ logger }: { logger: Logger }) => (
  fn: (req: Request, res: Response, next: Function) => Promise<any>
) => (req: Request, res: Response, next: Function) => {
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
    docs: docs || 'https://botpress.io/docs/cloud'
  })
}
